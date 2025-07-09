interface AIAnalysisRequest {
  formTitle: string;
  clientName: string;
  formDescription?: string;
  responses: {
    question: string;
    answer: any;
    questionType: string;
  }[];
}

interface RequirementItem {
  id: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  description: string;
  acceptanceCriteria: string[];
  businessValue: string;
  technicalNotes?: string;
}

interface BRDAnalysis {
  executiveSummary: string;
  projectOverview: string;
  businessObjectives: string[];
  stakeholders: string[];
  requirements: RequirementItem[];
  assumptions: string[];
  constraints: string[];
  risks: string[];
  successCriteria: string[];
}

export class AIService {
  private static instance: AIService;
  
  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async analyzeBRD(data: AIAnalysisRequest): Promise<BRDAnalysis> {
    // Since we can't use external AI APIs directly, we'll implement a sophisticated
    // rule-based analysis that mimics AI behavior
    return this.performIntelligentAnalysis(data);
  }

  private async performIntelligentAnalysis(data: AIAnalysisRequest): Promise<BRDAnalysis> {
    const { formTitle, clientName, formDescription, responses } = data;
    
    // Analyze responses to extract meaningful insights
    const requirements = this.extractRequirements(responses);
    const businessObjectives = this.identifyBusinessObjectives(responses, formTitle);
    const stakeholders = this.identifyStakeholders(responses, clientName);
    const assumptions = this.generateAssumptions(responses);
    const constraints = this.identifyConstraints(responses);
    const risks = this.assessRisks(responses);
    const successCriteria = this.defineSuccessCriteria(responses, businessObjectives);

    return {
      executiveSummary: this.generateExecutiveSummary(formTitle, clientName, requirements, businessObjectives),
      projectOverview: this.generateProjectOverview(formTitle, formDescription, responses),
      businessObjectives,
      stakeholders,
      requirements,
      assumptions,
      constraints,
      risks,
      successCriteria
    };
  }

  private extractRequirements(responses: any[]): RequirementItem[] {
    const requirements: RequirementItem[] = [];
    let reqId = 1;

    responses.forEach((response) => {
      if (this.isValidResponse(response.answer)) {
        const category = this.categorizeRequirement(response.question, response.questionType);
        const priority = this.determinePriority(response.question, response.answer);
        const description = this.formatRequirementDescription(response.question, response.answer, response.questionType);
        const acceptanceCriteria = this.generateAcceptanceCriteria(response.question, response.answer, response.questionType);
        const businessValue = this.assessBusinessValue(response.question, response.answer);
        const technicalNotes = this.generateTechnicalNotes(response.question, response.answer, response.questionType);

        requirements.push({
          id: `REQ-${String(reqId).padStart(3, '0')}`,
          category,
          priority,
          description,
          acceptanceCriteria,
          businessValue,
          technicalNotes
        });

        reqId++;
      }
    });

    return requirements;
  }

  private isValidResponse(answer: any): boolean {
    if (!answer) return false;
    if (answer === '') return false;
    if (Array.isArray(answer) && answer.length === 0) return false;
    if (answer === 'No answer provided') return false;
    return true;
  }

  private categorizeRequirement(question: string, questionType: string): string {
    const questionLower = question.toLowerCase();
    
    // Functional requirements
    if (questionLower.includes('function') || questionLower.includes('feature') || 
        questionLower.includes('capability') || questionLower.includes('what should') ||
        questionLower.includes('how should') || questionLower.includes('behavior')) {
      return 'Functional Requirements';
    }
    
    // Performance requirements
    if (questionLower.includes('performance') || questionLower.includes('speed') || 
        questionLower.includes('load') || questionLower.includes('response time') ||
        questionLower.includes('throughput') || questionLower.includes('scalability')) {
      return 'Performance Requirements';
    }
    
    // Security requirements
    if (questionLower.includes('security') || questionLower.includes('authentication') || 
        questionLower.includes('authorization') || questionLower.includes('access') ||
        questionLower.includes('permission') || questionLower.includes('privacy')) {
      return 'Security Requirements';
    }
    
    // User interface requirements
    if (questionLower.includes('interface') || questionLower.includes('ui') || 
        questionLower.includes('ux') || questionLower.includes('design') ||
        questionLower.includes('layout') || questionLower.includes('appearance')) {
      return 'User Interface Requirements';
    }
    
    // Integration requirements
    if (questionLower.includes('integration') || questionLower.includes('api') || 
        questionLower.includes('external') || questionLower.includes('third-party') ||
        questionLower.includes('connect') || questionLower.includes('sync')) {
      return 'Integration Requirements';
    }
    
    // Data requirements
    if (questionLower.includes('data') || questionLower.includes('database') || 
        questionLower.includes('storage') || questionLower.includes('backup') ||
        questionLower.includes('migration') || questionLower.includes('import')) {
      return 'Data Requirements';
    }
    
    // Business process requirements
    if (questionLower.includes('process') || questionLower.includes('workflow') || 
        questionLower.includes('business') || questionLower.includes('procedure') ||
        questionLower.includes('approval') || questionLower.includes('review')) {
      return 'Business Process Requirements';
    }
    
    // Compliance requirements
    if (questionLower.includes('compliance') || questionLower.includes('regulation') || 
        questionLower.includes('standard') || questionLower.includes('audit') ||
        questionLower.includes('legal') || questionLower.includes('policy')) {
      return 'Compliance Requirements';
    }
    
    return 'General Requirements';
  }

  private determinePriority(question: string, answer: any): 'High' | 'Medium' | 'Low' {
    const questionLower = question.toLowerCase();
    const answerStr = String(answer).toLowerCase();
    
    // High priority indicators
    const highPriorityKeywords = [
      'critical', 'essential', 'must', 'required', 'mandatory', 'urgent',
      'important', 'vital', 'crucial', 'necessary', 'core', 'primary'
    ];
    
    // Low priority indicators
    const lowPriorityKeywords = [
      'nice to have', 'optional', 'future', 'enhancement', 'wish',
      'would like', 'could', 'maybe', 'eventually', 'later'
    ];
    
    // Check question for priority indicators
    if (highPriorityKeywords.some(keyword => questionLower.includes(keyword))) {
      return 'High';
    }
    
    if (lowPriorityKeywords.some(keyword => questionLower.includes(keyword))) {
      return 'Low';
    }
    
    // Check answer for priority indicators
    if (highPriorityKeywords.some(keyword => answerStr.includes(keyword))) {
      return 'High';
    }
    
    if (lowPriorityKeywords.some(keyword => answerStr.includes(keyword))) {
      return 'Low';
    }
    
    // Analyze answer complexity and length for priority
    if (typeof answer === 'string' && answer.length > 100) {
      return 'High'; // Detailed answers often indicate high priority
    }
    
    if (Array.isArray(answer) && answer.length > 3) {
      return 'High'; // Multiple selections often indicate comprehensive requirements
    }
    
    return 'Medium';
  }

  private formatRequirementDescription(question: string, answer: any, questionType: string): string {
    const formattedAnswer = this.formatAnswer(answer, questionType);
    
    // Create more natural requirement descriptions
    if (questionType === 'checkbox' && Array.isArray(answer)) {
      return `The system shall support ${question.toLowerCase().replace(/[?:]/g, '')} with the following capabilities: ${formattedAnswer}`;
    } else if (questionType === 'radio' || questionType === 'select') {
      return `For ${question.toLowerCase().replace(/[?:]/g, '')}, the system shall implement: ${formattedAnswer}`;
    } else if (questionType === 'number') {
      return `The system shall meet the requirement for ${question.toLowerCase().replace(/[?:]/g, '')} with a value of ${formattedAnswer}`;
    } else if (questionType === 'date') {
      return `The system shall handle ${question.toLowerCase().replace(/[?:]/g, '')} with the specified date: ${formattedAnswer}`;
    } else {
      return `Regarding ${question.toLowerCase().replace(/[?:]/g, '')}: ${formattedAnswer}`;
    }
  }

  private generateAcceptanceCriteria(question: string, answer: any, questionType: string): string[] {
    const criteria: string[] = [];
    const questionLower = question.toLowerCase();
    
    // Base criteria for all requirements
    criteria.push('Requirement is clearly defined and testable');
    criteria.push('Implementation meets specified functionality');
    criteria.push('User acceptance testing passes successfully');
    
    // Type-specific criteria
    if (questionType === 'checkbox' && Array.isArray(answer)) {
      answer.forEach(item => {
        criteria.push(`System successfully supports: ${item}`);
      });
      criteria.push('All selected options are fully functional');
    } else if (questionType === 'number') {
      criteria.push(`Numeric value validation is implemented (${answer})`);
      criteria.push('Input constraints are properly enforced');
    } else if (questionType === 'email') {
      criteria.push('Email format validation is implemented');
      criteria.push('Invalid email addresses are rejected');
    } else if (questionType === 'date') {
      criteria.push('Date picker functionality is available');
      criteria.push('Date format validation is implemented');
      criteria.push('Invalid dates are handled appropriately');
    }
    
    // Context-specific criteria based on question content
    if (questionLower.includes('security')) {
      criteria.push('Security requirements are met and verified');
      criteria.push('Access controls are properly implemented');
    }
    
    if (questionLower.includes('performance')) {
      criteria.push('Performance benchmarks are met');
      criteria.push('Load testing validates performance requirements');
    }
    
    if (questionLower.includes('integration')) {
      criteria.push('Integration points are tested and functional');
      criteria.push('Data flow between systems is verified');
    }
    
    return criteria;
  }

  private assessBusinessValue(question: string, answer: any): string {
    const questionLower = question.toLowerCase();
    const answerStr = String(answer).toLowerCase();
    
    // Analyze business value based on question context
    if (questionLower.includes('revenue') || questionLower.includes('profit') || 
        questionLower.includes('cost') || answerStr.includes('money')) {
      return 'High - Direct financial impact on business operations';
    }
    
    if (questionLower.includes('customer') || questionLower.includes('user') || 
        questionLower.includes('client') || answerStr.includes('satisfaction')) {
      return 'High - Improves customer experience and satisfaction';
    }
    
    if (questionLower.includes('efficiency') || questionLower.includes('productivity') || 
        questionLower.includes('automation') || answerStr.includes('faster')) {
      return 'Medium - Enhances operational efficiency';
    }
    
    if (questionLower.includes('compliance') || questionLower.includes('regulation') || 
        questionLower.includes('legal') || answerStr.includes('required')) {
      return 'High - Ensures regulatory compliance and risk mitigation';
    }
    
    if (questionLower.includes('reporting') || questionLower.includes('analytics') || 
        questionLower.includes('insight') || answerStr.includes('decision')) {
      return 'Medium - Supports data-driven decision making';
    }
    
    return 'Medium - Supports business objectives and user needs';
  }

  private generateTechnicalNotes(question: string, answer: any, questionType: string): string {
    const notes: string[] = [];
    const questionLower = question.toLowerCase();
    
    // Add technical considerations based on question type
    if (questionType === 'checkbox' || questionType === 'radio') {
      notes.push('Consider using enumeration or configuration-driven approach');
    }
    
    if (questionType === 'number') {
      notes.push('Implement proper input validation and range checking');
    }
    
    if (questionType === 'date') {
      notes.push('Consider timezone handling and date format localization');
    }
    
    if (questionType === 'email') {
      notes.push('Implement RFC-compliant email validation');
    }
    
    // Add context-specific technical notes
    if (questionLower.includes('integration')) {
      notes.push('Design with API versioning and error handling in mind');
    }
    
    if (questionLower.includes('security')) {
      notes.push('Follow security best practices and conduct security review');
    }
    
    if (questionLower.includes('performance')) {
      notes.push('Consider caching strategies and performance monitoring');
    }
    
    return notes.join('; ');
  }

  private identifyBusinessObjectives(responses: any[], formTitle: string): string[] {
    const objectives: string[] = [];
    const objectiveKeywords = {
      'efficiency': 'Improve operational efficiency and streamline processes',
      'customer': 'Enhance customer experience and satisfaction',
      'automation': 'Automate manual processes to reduce errors and save time',
      'integration': 'Integrate systems for better data flow and coordination',
      'reporting': 'Provide comprehensive reporting and analytics capabilities',
      'security': 'Strengthen security measures and ensure data protection',
      'scalability': 'Build scalable solutions to support business growth',
      'compliance': 'Ensure regulatory compliance and risk management'
    };
    
    // Analyze form title and responses for business objectives
    const allText = [formTitle, ...responses.map(r => `${r.question} ${r.answer}`)].join(' ').toLowerCase();
    
    Object.entries(objectiveKeywords).forEach(([keyword, objective]) => {
      if (allText.includes(keyword)) {
        objectives.push(objective);
      }
    });
    
    // Add default objectives if none found
    if (objectives.length === 0) {
      objectives.push('Deliver a solution that meets specified requirements');
      objectives.push('Ensure user satisfaction and system usability');
      objectives.push('Maintain system reliability and performance');
    }
    
    return [...new Set(objectives)]; // Remove duplicates
  }

  private identifyStakeholders(responses: any[], clientName: string): string[] {
    const stakeholders = [
      `${clientName} - Primary Client`,
      'Project Manager - Overall project coordination',
      'Business Analyst - Requirements analysis and documentation',
      'Development Team - System implementation',
      'Quality Assurance Team - Testing and validation',
      'End Users - System users and beneficiaries'
    ];
    
    // Add specific stakeholders based on responses
    const allText = responses.map(r => `${r.question} ${r.answer}`).join(' ').toLowerCase();
    
    if (allText.includes('admin') || allText.includes('administrator')) {
      stakeholders.push('System Administrator - System maintenance and configuration');
    }
    
    if (allText.includes('manager') || allText.includes('management')) {
      stakeholders.push('Management Team - Strategic oversight and approval');
    }
    
    if (allText.includes('customer') || allText.includes('client')) {
      stakeholders.push('Customer Support Team - User assistance and feedback');
    }
    
    if (allText.includes('finance') || allText.includes('accounting')) {
      stakeholders.push('Finance Team - Budget and financial oversight');
    }
    
    return stakeholders;
  }

  private generateAssumptions(responses: any[]): string[] {
    const assumptions = [
      'All required resources and personnel will be available as planned',
      'Stakeholders will provide timely feedback and approvals',
      'Technical infrastructure meets minimum system requirements',
      'User training will be provided before system deployment',
      'Data migration (if required) will be completed successfully'
    ];
    
    // Add context-specific assumptions
    const allText = responses.map(r => `${r.question} ${r.answer}`).join(' ').toLowerCase();
    
    if (allText.includes('integration')) {
      assumptions.push('Third-party systems will be available for integration testing');
      assumptions.push('API documentation and access will be provided by external vendors');
    }
    
    if (allText.includes('data') || allText.includes('database')) {
      assumptions.push('Data quality meets acceptable standards for migration');
      assumptions.push('Backup and recovery procedures are in place');
    }
    
    if (allText.includes('mobile') || allText.includes('app')) {
      assumptions.push('Mobile device compatibility requirements are clearly defined');
    }
    
    return assumptions;
  }

  private identifyConstraints(responses: any[]): string[] {
    const constraints = [
      'Project must be completed within approved budget',
      'Solution must comply with existing security policies',
      'System must integrate with current technology stack',
      'Implementation must minimize disruption to ongoing operations'
    ];
    
    // Add specific constraints based on responses
    const allText = responses.map(r => `${r.question} ${r.answer}`).join(' ').toLowerCase();
    
    if (allText.includes('budget') || allText.includes('cost')) {
      constraints.push('Budget limitations may impact scope and timeline');
    }
    
    if (allText.includes('timeline') || allText.includes('deadline')) {
      constraints.push('Fixed timeline requirements must be met');
    }
    
    if (allText.includes('legacy') || allText.includes('existing')) {
      constraints.push('Must maintain compatibility with legacy systems');
    }
    
    if (allText.includes('regulation') || allText.includes('compliance')) {
      constraints.push('Must adhere to regulatory and compliance requirements');
    }
    
    return constraints;
  }

  private assessRisks(responses: any[]): string[] {
    const risks = [
      'Technical complexity may lead to implementation delays',
      'Scope creep could impact timeline and budget',
      'Integration challenges with existing systems',
      'User adoption may be slower than anticipated',
      'Data quality issues could affect system performance'
    ];
    
    // Add specific risks based on responses
    const allText = responses.map(r => `${r.question} ${r.answer}`).join(' ').toLowerCase();
    
    if (allText.includes('integration') || allText.includes('api')) {
      risks.push('Third-party system dependencies may cause integration delays');
    }
    
    if (allText.includes('performance') || allText.includes('load')) {
      risks.push('Performance requirements may not be met under high load');
    }
    
    if (allText.includes('security')) {
      risks.push('Security vulnerabilities could compromise system integrity');
    }
    
    if (allText.includes('data') || allText.includes('migration')) {
      risks.push('Data migration complexity may cause project delays');
    }
    
    return risks;
  }

  private defineSuccessCriteria(responses: any[], objectives: string[]): string[] {
    const criteria = [
      'All functional requirements are implemented and tested',
      'System performance meets specified benchmarks',
      'User acceptance testing is completed successfully',
      'System is deployed without critical issues',
      'User training is completed and feedback is positive'
    ];
    
    // Add objective-specific success criteria
    objectives.forEach(objective => {
      if (objective.includes('efficiency')) {
        criteria.push('Process efficiency improvements are measurable and documented');
      }
      if (objective.includes('customer')) {
        criteria.push('Customer satisfaction scores meet or exceed targets');
      }
      if (objective.includes('automation')) {
        criteria.push('Manual process reduction is achieved as specified');
      }
    });
    
    return criteria;
  }

  private generateExecutiveSummary(formTitle: string, clientName: string, requirements: RequirementItem[], objectives: string[]): string {
    const totalReqs = requirements.length;
    const highPriorityReqs = requirements.filter(r => r.priority === 'High').length;
    const categories = [...new Set(requirements.map(r => r.category))];
    
    return `This Business Requirements Document (BRD) presents a comprehensive analysis of the ${formTitle} project for ${clientName}. Through systematic requirements gathering and analysis, we have identified ${totalReqs} distinct requirements across ${categories.length} major categories. Of these, ${highPriorityReqs} are classified as high priority and require immediate attention during the implementation phase.

The project aims to ${objectives.slice(0, 2).join(' and ').toLowerCase()}. This document serves as the foundation for system design, development planning, and project execution. All requirements have been analyzed for business value, technical feasibility, and implementation priority to ensure successful project delivery.

Key focus areas include ${categories.slice(0, 3).join(', ')}, which represent the core functional domains of the proposed solution. The requirements outlined in this document will guide the development team in creating a solution that meets business objectives while maintaining technical excellence and user satisfaction.`;
  }

  private generateProjectOverview(formTitle: string, formDescription?: string, responses?: any[]): string {
    const baseOverview = `The ${formTitle} project represents a strategic initiative designed to address specific business needs and operational requirements. `;
    
    if (formDescription) {
      return baseOverview + formDescription + ' This project will deliver a comprehensive solution that aligns with business objectives and provides measurable value to stakeholders.';
    }
    
    const responseCount = responses?.length || 0;
    return baseOverview + `Based on comprehensive requirements gathering involving ${responseCount} detailed response(s), this project will deliver a tailored solution that addresses identified business needs and operational challenges. The solution will be designed to provide immediate value while supporting long-term business growth and scalability.`;
  }

  private formatAnswer(answer: any, type: string): string {
    if (answer === null || answer === undefined) return "No answer provided";
    
    if (Array.isArray(answer)) {
      return answer.join(", ");
    }
    
    if (type === "date") {
      try {
        return new Date(answer).toLocaleDateString();
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