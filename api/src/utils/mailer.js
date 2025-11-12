const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_SENDER = process.env.EMAIL_SENDER || 'Daily Prayers <no-reply@dailyprayers.app>';

async function sendEmail({ to, subject, html, text }) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not configured. Email was not sent.', { to, subject });
    return false;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_SENDER,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Falha ao enviar e-mail de confirmação: ${message}`);
  }

  return true;
}

module.exports = {
  sendEmail,
};
