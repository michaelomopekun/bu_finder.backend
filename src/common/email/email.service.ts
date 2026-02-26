import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not set - email sending will not work');
    }
    this.resend = new Resend(apiKey);
    this.fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL') || 'noreply@bufinder.com';
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      if (result.error) {
        this.logger.error(`Failed to send email to ${options.to}:`, result.error);
        throw new Error(`Email sending failed: ${JSON.stringify(result.error)}`);
      }

      this.logger.log(`Email sent to ${options.to} (ID: ${result.data?.id})`);
    } catch (error) {
      this.logger.error(`Error sending email to ${options.to}:`, error);
      throw error;
    }
  }

  /**
   * Generates HTML email template for match notification
   */
  generateMatchNotificationHtml(
    recipientName: string,
    itemTitle: string,
    itemDescription: string,
    matchScore: number,
    itemType: 'LOST' | 'FOUND',
  ): string {
    const matchType = itemType === 'LOST' ? 'found' : 'lost';
    const scorePercentage = Math.round(matchScore * 100);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
            .match-score { 
              background-color: #dbeafe; 
              padding: 10px; 
              border-left: 4px solid #2563eb; 
              margin: 15px 0;
            }
            .button { 
              display: inline-block; 
              background-color: #2563eb; 
              color: white; 
              padding: 10px 20px; 
              text-decoration: none; 
              border-radius: 5px; 
              margin-top: 15px;
            }
            .footer { font-size: 12px; color: #999; margin-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎉 Potential Match Found!</h2>
            </div>
            <div class="content">
              <p>Hi ${recipientName},</p>
              <p>
                Great news! Someone ${matchType} an item that matches your ${itemType === 'LOST' ? 'lost' : 'found'} item:
              </p>
              <h3>"${itemTitle}"</h3>
              <p><strong>Description:</strong> ${itemDescription}</p>
              <div class="match-score">
                <strong>Match Confidence: ${scorePercentage}%</strong>
              </div>
              <p>
                ${itemType === 'LOST' 
                  ? 'The person who found this item may be able to help you recover it!' 
                  : 'The person who lost this item might be looking for it!'}
              </p>
              <a href="https://bufinder.com/notifications" class="button">View Matches</a>
              <div class="footer">
                <p>This is an automated message from BU Finder. Please do not reply to this email.</p>
                <p>&copy; 2026 BU Finder. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
