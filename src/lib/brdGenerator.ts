import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { AIService } from './aiService';

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

export class BRDGenerator {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number;
  private currentY: number;
  private aiService: AIService;

  constructor() {
    this.doc = new jsPDF();
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.margin = 20;
    this.currentY = this.margin;
    this.aiService = AIService.getInstance();
  }

  private addHeader(title: string, subtitle?: string) {
    // Company/Brand Header
    this.doc.setFillColor(98, 70, 234); // Primary color
    this.doc.rect(0, 0, this.pageWidth, 30, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('BUSINESS REQUIREMENTS DOCUMENT', this.pageWidth / 2, 20, { align: 'center' });
    
    // Title section
    this.currentY = 45;
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(20);
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

  private addSection(title: string, content: string | string[], level: number = 1) {
    this.checkPageBreak(30);
    
    // Section title
    const fontSize = level === 1 ? 16 : level === 2 ? 14 : 12;
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(98, 70, 234);
    
    const prefix = level === 1 ? '' : level === 2 ? '  ' : '    ';
    this.doc.text(`${prefix}${title}`, this.margin, this.currentY);
    this.currentY += 15;
    
    // Section content
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    if (Array.isArray(content)) {
      content.forEach(line => {
        this.checkPageBreak(10);
        this.doc.text(`• ${line}`, this.margin + 10, this.currentY);
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

  private addRequirementsTable(requirements: any[]) {
    this.checkPageBreak(50);
    
    const tableData = requirements.map(req => [
      req.id,
      req.category,
      req.priority,
      req.description.length > 80 ? req.description.substring(0, 80) + '...' : req.description,
      req.businessValue.length > 60 ? req.businessValue.substring(0, 60) + '...' : req.businessValue
    ]);

    this.doc.autoTable({
      startY: this.currentY,
      head: [['ID', 'Category', 'Priority', 'Description', 'Business Value']],
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
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 35 },
        2: { cellWidth: 20 },
        3: { cellWidth: 70 },
        4: { cellWidth: 45 }
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        this.currentY = data.cursor?.y || this.currentY;
      }
    });

    this.currentY += 20;
  }

  private addDetailedRequirements(requirements: any[]) {
    const categories = [...new Set(requirements.map(r => r.category))];
    
    categories.forEach((category, categoryIndex) => {
      const categoryRequirements = requirements.filter(r => r.category === category);
      
      this.addSection(`6.${categoryIndex + 1} ${category}`, '', 2);
      
      categoryRequirements.forEach((req) => {
        this.checkPageBreak(60);
        
        // Requirement header
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(0, 0, 0);
        this.doc.text(`${req.id}: ${req.description.substring(0, 80)}${req.description.length > 80 ? '...' : ''}`, this.margin + 10, this.currentY);
        this.currentY += 12;
        
        // Priority and Business Value
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'bold');
        const priorityColor = req.priority === 'High' ? [220, 38, 38] : 
                            req.priority === 'Medium' ? [245, 158, 11] : [34, 197, 94];
        this.doc.setTextColor(...priorityColor);
        this.doc.text(`Priority: ${req.priority}`, this.margin + 10, this.currentY);
        this.currentY += 8;
        
        // Full Description
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(0, 0, 0);
        this.doc.text('Description:', this.margin + 10, this.currentY);
        this.currentY += 6;
        
        const descLines = this.doc.splitTextToSize(req.description, this.pageWidth - 2 * this.margin - 20);
        descLines.forEach((line: string) => {
          this.checkPageBreak(8);
          this.doc.text(line, this.margin + 15, this.currentY);
          this.currentY += 6;
        });
        
        // Business Value
        this.currentY += 4;
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Business Value:', this.margin + 10, this.currentY);
        this.currentY += 6;
        this.doc.setFont('helvetica', 'normal');
        
        const valueLines = this.doc.splitTextToSize(req.businessValue, this.pageWidth - 2 * this.margin - 20);
        valueLines.forEach((line: string) => {
          this.checkPageBreak(8);
          this.doc.text(line, this.margin + 15, this.currentY);
          this.currentY += 6;
        });
        
        // Acceptance Criteria
        this.currentY += 4;
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Acceptance Criteria:', this.margin + 10, this.currentY);
        this.currentY += 6;
        this.doc.setFont('helvetica', 'normal');
        
        req.acceptanceCriteria.forEach((criteria: string) => {
          this.checkPageBreak(8);
          this.doc.text(`• ${criteria}`, this.margin + 15, this.currentY);
          this.currentY += 6;
        });
        
        // Technical Notes
        if (req.technicalNotes) {
          this.currentY += 4;
          this.doc.setFont('helvetica', 'bold');
          this.doc.text('Technical Notes:', this.margin + 10, this.currentY);
          this.currentY += 6;
          this.doc.setFont('helvetica', 'normal');
          
          const techLines = this.doc.splitTextToSize(req.technicalNotes, this.pageWidth - 2 * this.margin - 20);
          techLines.forEach((line: string) => {
            this.checkPageBreak(8);
            this.doc.text(line, this.margin + 15, this.currentY);
            this.currentY += 6;
          });
        }
        
        this.currentY += 15;
      });
    });
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
      this.doc.text('RequireFlow - AI-Powered Requirements Analysis', this.margin, this.pageHeight - 8);
    }
  }

  public async generateBRD(formData: FormData, responses: ResponseData[]): Promise<jsPDF> {
    // Prepare data for AI analysis
    const analysisData = {
      formTitle: formData.title,
      clientName: formData.client_name,
      formDescription: formData.description,
      responses: responses.flatMap(response => 
        response.responses.map(r => ({
          question: r.question_label,
          answer: r.answer,
          questionType: r.question_type
        }))
      )
    };

    // Get AI analysis
    const analysis = await this.aiService.analyzeBRD(analysisData);

    // Header
    this.addHeader(
      `${formData.title}`,
      `Business Requirements Document for ${formData.client_name}`
    );

    // Document Information
    this.addSection('1. Document Information', [
      `Document Title: Business Requirements Document - ${formData.title}`,
      `Client: ${formData.client_name}`,
      `Document Version: 1.0`,
      `Date Created: ${format(new Date(), 'PPP')}`,
      `Form Created: ${format(new Date(formData.created_at), 'PPP')}`,
      `Total Responses Analyzed: ${responses.length}`,
      `Document Status: Final`,
      `Analysis Method: AI-Powered Requirements Analysis`
    ]);

    // Executive Summary
    this.addSection('2. Executive Summary', analysis.executiveSummary);

    // Project Overview
    this.addSection('3. Project Overview', analysis.projectOverview);

    // Business Objectives
    this.addSection('4. Business Objectives', analysis.businessObjectives);

    // Stakeholders
    this.addSection('5. Stakeholders', analysis.stakeholders);

    // Requirements Summary
    const priorityCounts = {
      High: analysis.requirements.filter(r => r.priority === 'High').length,
      Medium: analysis.requirements.filter(r => r.priority === 'Medium').length,
      Low: analysis.requirements.filter(r => r.priority === 'Low').length
    };

    this.addSection('6. Requirements Summary', [
      `Total Requirements Identified: ${analysis.requirements.length}`,
      `High Priority: ${priorityCounts.High}`,
      `Medium Priority: ${priorityCounts.Medium}`,
      `Low Priority: ${priorityCounts.Low}`,
      `Categories: ${[...new Set(analysis.requirements.map(r => r.category))].join(', ')}`
    ]);

    // Requirements Overview Table
    this.addSection('7. Requirements Overview', '');
    this.addRequirementsTable(analysis.requirements);

    // Detailed Requirements
    this.addSection('8. Detailed Requirements', '');
    this.addDetailedRequirements(analysis.requirements);

    // Assumptions
    this.addSection('9. Assumptions', analysis.assumptions);

    // Constraints
    this.addSection('10. Constraints', analysis.constraints);

    // Risks
    this.addSection('11. Risks and Mitigation', analysis.risks);

    // Success Criteria
    this.addSection('12. Success Criteria', analysis.successCriteria);

    // Appendices
    this.addSection('13. Appendices', '');
    
    this.addSection('13.1 Response Analysis Summary', '', 2);
    responses.forEach((response, index) => {
      this.checkPageBreak(30);
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`Response #${index + 1} (${format(new Date(response.created_at), 'PPP')})`, this.margin + 10, this.currentY);
      this.currentY += 10;
      
      response.responses.forEach(r => {
        this.checkPageBreak(15);
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(`Q: ${r.question_label}`, this.margin + 15, this.currentY);
        this.currentY += 7;
        
        this.doc.setFont('helvetica', 'normal');
        const answerText = this.formatAnswer(r.answer, r.question_type);
        const answerLines = this.doc.splitTextToSize(`A: ${answerText}`, this.pageWidth - 2 * this.margin - 20);
        answerLines.forEach((line: string) => {
          this.checkPageBreak(7);
          this.doc.text(line, this.margin + 15, this.currentY);
          this.currentY += 7;
        });
        this.currentY += 3;
      });
      
      this.currentY += 10;
    });

    // Add footer to all pages
    this.addFooter();

    return this.doc;
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
}

export const downloadBRD = async (formData: FormData, responses: ResponseData[]) => {
  const generator = new BRDGenerator();
  const pdf = await generator.generateBRD(formData, responses);
  pdf.save(`${formData.client_name}_BRD_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};