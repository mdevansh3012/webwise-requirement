import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface FormData {
  id: string;
  title: string;
  client_name: string;
  description: string;
  created_at: string;
}

interface ResponseData {
  session_id: string;
  created_at: string;
  responses: {
    question_id: string;
    question_label: string;
    question_type: string;
    answer: any;
  }[];
}

interface PDFOptions {
  includeClientDetails?: boolean;
  includeFormDetails?: boolean;
  includeResponseSummary?: boolean;
  customHeader?: string;
  customFooter?: string;
}

export class PDFGenerator {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number;
  private currentY: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.margin = 20;
    this.currentY = this.margin;
  }

  private addHeader(title: string, subtitle?: string) {
    // Company/Brand Header
    this.doc.setFillColor(98, 70, 234); // Primary color
    this.doc.rect(0, 0, this.pageWidth, 25, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RequireFlow', this.margin, 17);
    
    // Title section
    this.currentY = 40;
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    
    if (subtitle) {
      this.currentY += 10;
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(subtitle, this.margin, this.currentY);
    }
    
    this.currentY += 20;
    this.addSeparator();
  }

  private addSeparator() {
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  private addSection(title: string, content: string | string[]) {
    this.checkPageBreak(30);
    
    // Section title
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(98, 70, 234);
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 15;
    
    // Section content
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    if (Array.isArray(content)) {
      content.forEach(line => {
        this.checkPageBreak(10);
        this.doc.text(line, this.margin + 5, this.currentY);
        this.currentY += 7;
      });
    } else {
      const lines = this.doc.splitTextToSize(content, this.pageWidth - 2 * this.margin - 10);
      lines.forEach((line: string) => {
        this.checkPageBreak(10);
        this.doc.text(line, this.margin + 5, this.currentY);
        this.currentY += 7;
      });
    }
    
    this.currentY += 10;
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Footer line
      this.doc.setDrawColor(200, 200, 200);
      this.doc.line(this.margin, this.pageHeight - 25, this.pageWidth - this.margin, this.pageHeight - 25);
      
      // Footer text
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 100, 100);
      
      const generatedText = `Generated on ${format(new Date(), 'PPP')} at ${format(new Date(), 'p')}`;
      this.doc.text(generatedText, this.margin, this.pageHeight - 15);
      
      const pageText = `Page ${i} of ${pageCount}`;
      const pageTextWidth = this.doc.getTextWidth(pageText);
      this.doc.text(pageText, this.pageWidth - this.margin - pageTextWidth, this.pageHeight - 15);
      
      // Company info
      this.doc.text('RequireFlow - Professional Requirements Gathering', this.margin, this.pageHeight - 8);
    }
  }

  private formatAnswer(answer: any, type: string): string {
    if (answer === null || answer === undefined) return "No answer provided";
    
    if (Array.isArray(answer)) {
      return answer.join(", ");
    }
    
    if (type === "date") {
      try {
        return format(new Date(answer), "PPP");
      } catch {
        return String(answer);
      }
    }
    
    if (typeof answer === 'object') {
      return JSON.stringify(answer, null, 2);
    }
    
    return String(answer);
  }

  public generateResponsesPDF(
    formData: FormData,
    responses: ResponseData[],
    options: PDFOptions = {}
  ): jsPDF {
    const {
      includeClientDetails = true,
      includeFormDetails = true,
      includeResponseSummary = true
    } = options;

    // Header
    this.addHeader(
      'Form Responses Report',
      `${formData.title} - ${formData.client_name}`
    );

    // Executive Summary
    if (includeResponseSummary) {
      const totalResponses = responses.length;
      const avgResponsesPerDay = totalResponses > 0 ? 
        (totalResponses / Math.max(1, Math.ceil((Date.now() - new Date(formData.created_at).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(1) : '0';
      
      this.addSection('Executive Summary', [
        `Total Responses: ${totalResponses}`,
        `Form Created: ${format(new Date(formData.created_at), 'PPP')}`,
        `Report Generated: ${format(new Date(), 'PPP')}`,
        `Average Responses per Day: ${avgResponsesPerDay}`,
        `Response Rate: ${totalResponses > 0 ? 'Active' : 'No responses yet'}`
      ]);
    }

    // Client Details
    if (includeClientDetails) {
      this.addSection('Client Information', [
        `Client Name: ${formData.client_name}`,
        `Form Title: ${formData.title}`,
        `Form ID: ${formData.id}`,
        `Description: ${formData.description || 'No description provided'}`
      ]);
    }

    // Form Details
    if (includeFormDetails && responses.length > 0) {
      const sampleResponse = responses[0];
      const questionCount = sampleResponse.responses.length;
      const questionTypes = [...new Set(sampleResponse.responses.map(r => r.question_type))];
      
      this.addSection('Form Structure', [
        `Total Questions: ${questionCount}`,
        `Question Types: ${questionTypes.join(', ')}`,
        `Form URL: /${formData.client_name}`
      ]);
    }

    // Responses Details
    if (responses.length === 0) {
      this.addSection('Responses', 'No responses have been submitted yet.');
    } else {
      responses.forEach((response, index) => {
        this.checkPageBreak(50);
        
        // Response header
        this.doc.setFontSize(14);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(98, 70, 234);
        this.doc.text(`Response #${index + 1}`, this.margin, this.currentY);
        
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(100, 100, 100);
        this.doc.text(
          `Submitted: ${format(new Date(response.created_at), 'PPP \'at\' p')}`,
          this.margin + 80,
          this.currentY
        );
        
        this.currentY += 15;

        // Response table
        const tableData = response.responses.map(r => [
          r.question_label,
          r.question_type.toUpperCase(),
          this.formatAnswer(r.answer, r.question_type)
        ]);

        this.doc.autoTable({
          startY: this.currentY,
          head: [['Question', 'Type', 'Answer']],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [98, 70, 234],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 9,
            cellPadding: 5
          },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 25 },
            2: { cellWidth: 'auto' }
          },
          margin: { left: this.margin, right: this.margin },
          didDrawPage: (data) => {
            this.currentY = data.cursor?.y || this.currentY;
          }
        });

        this.currentY += 20;
      });
    }

    // Add footer to all pages
    this.addFooter();

    return this.doc;
  }

  public generateSummaryPDF(
    formData: FormData,
    responses: ResponseData[],
    analytics?: {
      completionRate: number;
      averageTimeToComplete: string;
      mostCommonAnswers: { question: string; answer: string; count: number }[];
    }
  ): jsPDF {
    this.addHeader(
      'Form Analytics Summary',
      `${formData.title} - ${formData.client_name}`
    );

    // Key Metrics
    this.addSection('Key Metrics', [
      `Total Responses: ${responses.length}`,
      `Form Created: ${format(new Date(formData.created_at), 'PPP')}`,
      `Last Response: ${responses.length > 0 ? format(new Date(responses[0].created_at), 'PPP') : 'No responses'}`,
      `Completion Rate: ${analytics?.completionRate || 0}%`,
      `Average Time to Complete: ${analytics?.averageTimeToComplete || 'N/A'}`
    ]);

    // Response Trends (if we have multiple responses)
    if (responses.length > 1) {
      const responsesByDate = responses.reduce((acc, response) => {
        const date = format(new Date(response.created_at), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const trendData = Object.entries(responsesByDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => [format(new Date(date), 'MMM dd'), count.toString()]);

      this.doc.autoTable({
        startY: this.currentY,
        head: [['Date', 'Responses']],
        body: trendData,
        theme: 'striped',
        headStyles: {
          fillColor: [98, 70, 234],
          textColor: [255, 255, 255]
        }
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 20;
    }

    this.addFooter();
    return this.doc;
  }
}

export const downloadResponsesPDF = (
  formData: FormData,
  responses: ResponseData[],
  options?: PDFOptions
) => {
  const generator = new PDFGenerator();
  const pdf = generator.generateResponsesPDF(formData, responses, options);
  pdf.save(`${formData.client_name}_responses_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const downloadSummaryPDF = (
  formData: FormData,
  responses: ResponseData[],
  analytics?: any
) => {
  const generator = new PDFGenerator();
  const pdf = generator.generateSummaryPDF(formData, responses, analytics);
  pdf.save(`${formData.client_name}_summary_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};