import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.VITE_EMAIL_USER,
    pass: process.env.VITE_EMAIL_PASSWORD
  }
});

interface TeamMember {
  name: string;
  email: string;
  phone: string;
}

interface ETicketData {
  teamName: string;
  registrationId: string;
  member: TeamMember;
  eventDetails: {
    date: string;
    venue: string;
    workshopTitle?: string;
  };
}

export const generateETicket = async (data: ETicketData): Promise<Buffer> => {
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(24);
  doc.text('STARTUP SPARK 2025', 105, 20, { align: 'center' });
  
  // Add QR Code
  const qrData = JSON.stringify({
    regId: data.registrationId,
    name: data.member.name,
    team: data.teamName
  });
  
  const qrCode = await QRCode.toDataURL(qrData);
  doc.addImage(qrCode, 'PNG', 75, 30, 60, 60);
  
  // Add ticket details
  doc.setFontSize(14);
  doc.text('E-Ticket', 20, 100);
  doc.setFontSize(12);
  doc.text(`Team: ${data.teamName}`, 20, 120);
  doc.text(`Registration ID: ${data.registrationId}`, 20, 130);
  doc.text(`Name: ${data.member.name}`, 20, 140);
  doc.text(`Email: ${data.member.email}`, 20, 150);
  doc.text(`Phone: ${data.member.phone}`, 20, 160);
  
  // Event details
  doc.text('Event Details:', 20, 180);
  doc.text(`Date: ${data.eventDetails.date}`, 20, 190);
  doc.text(`Venue: ${data.eventDetails.venue}`, 20, 200);
  if (data.eventDetails.workshopTitle) {
    doc.text(`Workshop: ${data.eventDetails.workshopTitle}`, 20, 210);
  }
  
  // Convert to Buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
};

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  attachments?: Array<{ filename: string; content: Buffer }>
) => {
  try {
    await transporter.sendMail({
      from: process.env.VITE_EMAIL_USER,
      to,
      subject,
      html,
      attachments
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const sendWorkshopInvite = async (
  teamData: {
    teamName: string;
    registrationId: string;
    members: TeamMember[];
  },
  workshopDetails: {
    title: string;
    date: string;
    venue: string;
  }
) => {
  try {
    for (const member of teamData.members) {
      const eTicketData: ETicketData = {
        teamName: teamData.teamName,
        registrationId: teamData.registrationId,
        member,
        eventDetails: {
          date: workshopDetails.date,
          venue: workshopDetails.venue,
          workshopTitle: workshopDetails.title
        }
      };
      
      const eTicketPdf = await generateETicket(eTicketData);
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">Workshop Invitation</h1>
          <p>Dear ${member.name},</p>
          <p>You are invited to attend the following workshop as part of Startup Spark 2025:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #4f46e5;">${workshopDetails.title}</h2>
            <p><strong>Date:</strong> ${workshopDetails.date}</p>
            <p><strong>Venue:</strong> ${workshopDetails.venue}</p>
          </div>
          <p>Your e-ticket is attached to this email. Please bring a printed copy or show the digital version at the venue.</p>
          <p>Best regards,<br>Team Startup Spark</p>
        </div>
      `;
      
      await sendEmail(
        member.email,
        `Workshop Invitation: ${workshopDetails.title}`,
        emailHtml,
        [{ filename: 'e-ticket.pdf', content: eTicketPdf }]
      );
    }
    return true;
  } catch (error) {
    console.error('Error sending workshop invites:', error);
    return false;
  }
};

export const sendPhase2Selection = async (
  teamData: {
    teamName: string;
    registrationId: string;
    members: TeamMember[];
    score: number;
  }
) => {
  try {
    for (const member of teamData.members) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">Congratulations! You're Selected for Phase 2</h1>
          <p>Dear ${member.name},</p>
          <p>We are pleased to inform you that your team has been selected for Phase 2 of Startup Spark 2025!</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #4f46e5;">Team Details</h2>
            <p><strong>Team Name:</strong> ${teamData.teamName}</p>
            <p><strong>Registration ID:</strong> ${teamData.registrationId}</p>
            <p><strong>Phase 1 Score:</strong> ${teamData.score}</p>
          </div>
          <p>Please prepare for Phase 2 by following the guidelines that will be shared soon.</p>
          <p>Best regards,<br>Team Startup Spark</p>
        </div>
      `;
      
      await sendEmail(
        member.email,
        'Congratulations! Selected for Phase 2 - Startup Spark 2025',
        emailHtml
      );
    }
    return true;
  } catch (error) {
    console.error('Error sending Phase 2 selection emails:', error);
    return false;
  }
};