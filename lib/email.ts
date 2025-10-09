//import "server-only";
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.office365.com", // Microsoft SMTP server for Office 365
  port: 587, // Port for TLS/STARTTLS
  secure: false, // Upgrade later with STARTTLS
  auth: {
    user: process.env.EMAIL, // Your Microsoft email address
    pass: process.env.PASSWORD, // Your Microsoft email password
  },
});
