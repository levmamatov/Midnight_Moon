import os
import smtplib
import time
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import FastAPI, BackgroundTasks, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
import httpx

app = FastAPI(title="Resort Booking API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "online", "project": "Midnight_Moon API"}

# Переменные окружения
TG_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TG_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
EMAIL_TO = os.getenv("EMAIL_TO")


class BookingRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=20)
    phone: str = Field(..., min_length=10)
    house_type: str
    check_in: str
    check_out: str
    comment: str | None = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r"[\s\-\(\)]", "", v)
        # Проверяем формат РФ номера (+7... или 8...)
        if not re.match(r"^(\+7|8)\d{10}$", cleaned):
            raise ValueError("Некорректный номер телефона. Укажите номер в формате +7 (XXX) XXX-XX-XX")
        return cleaned

    @field_validator("check_in", "check_out")
    @classmethod
    def validate_year(cls, v: str) -> str:
        # Извлекаем год из даты (предполагается YYYY-MM-DD)
        try:
            year = int(v.split("-")[0])
            if year > 2027:
                raise ValueError("Заявки на год позже 2027 временно не принимаются онлайн. Пожалуйста, позвоните нам или напишите на почту!")
        except (IndexError, ValueError) as e:
            if "2027" in str(e):
                raise e
            raise ValueError("Неверный формат даты.")
        return v


# Функция отправки в Telegram
async def send_telegram(booking: BookingRequest):
    if not TG_BOT_TOKEN or not TG_CHAT_ID:
        print("❌ TELEGRAM ERROR: TG_BOT_TOKEN или TG_CHAT_ID не заданы в переменных окружения!")
        return False

    msg = (
        f"<b>Новая заявка с сайта!</b>\n\n"
        f"<b>Имя:</b> {booking.name}\n"
        f"<b>Телефон:</b> {booking.phone}\n"
        f"<b>Домик:</b> {booking.house_type}\n"
        f"<b>Даты:</b> {booking.check_in} — {booking.check_out}\n"
        f"<b>Комментарий:</b> {booking.comment or 'Нет'}"
    )

    url = f"https://api.telegram.org/bot{TG_BOT_TOKEN}/sendMessage"
    payload = {"chat_id": TG_CHAT_ID, "text": msg, "parse_mode": "HTML"}

    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(url, json=payload, timeout=10.0)
            if res.status_code != 200:
                print(f"❌ TELEGRAM API REJECTED: Код {res.status_code}, Ответ: {res.text}")
                return False
            print("✅ Уведомление в Telegram успешно отправлено!")
            return True
    except Exception as e:
        print(f"❌ TELEGRAM EXCEPTION: {e}")
        return False


# Функция отправки на Email
def send_email(booking: BookingRequest):
    if not SMTP_USER or not SMTP_PASSWORD or not EMAIL_TO:
        print("❌ EMAIL ERROR: Какие-то из переменных SMTP_USER, SMTP_PASSWORD, EMAIL_TO не заданы!")
        return

    msg = MIMEMultipart()
    msg['From'] = SMTP_USER
    msg['To'] = EMAIL_TO
    msg['Subject'] = f"Новая бронь: {booking.house_type} ({booking.name})"

    body = f"""
    Новая заявка на бронирование:

    Имя: {booking.name}
    Телефон: {booking.phone}
    Домик: {booking.house_type}
    Даты: {booking.check_in} — {booking.check_out}
    Комментарий: {booking.comment or 'Нет'}
    """
    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    try:
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout = 10) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        print("✅ Письмо успешно отправлено через порт 465!")
        return True
    except Exception as e_465:
        print(f"⚠️ Порт 465 выдал ошибку: {e_465}. Пробуем порт 587...")

    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        print("✅ Письмо успешно отправлено через порт 587!")
        return True
    except Exception as e_587:
        print(f"❌ Ошибка: оба порта недоступны. Последняя ошибка: {e_587}")
        return False



@app.post("/api/v1/booking", status_code=status.HTTP_201_CREATED)
async def create_booking(booking: BookingRequest, background_tasks: BackgroundTasks):
    # Отправляем в Telegram
    tg_status = await send_telegram(booking)

    # Фоновая отправка на почту
    background_tasks.add_task(send_email, booking)

    return {
        "success": True,
        "message": "Заявка успешно принята!",
        "telegram_sent": tg_status
    }