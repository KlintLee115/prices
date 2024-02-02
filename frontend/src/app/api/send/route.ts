import EmailTemplate from '@/components/email-template';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  try {
    const data = await resend.emails.send({
      from: 'loeyer4@gmail.com',
      to: ['programmerder@gmail.com'],
      subject: 'Hello world',
      react: EmailTemplate({ firstName: 'John' }),
      text:"hey"
    });

    return Response.json(data);
  } catch (error) {
    return Response.json({ error });
  }
}
