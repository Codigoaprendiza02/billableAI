// BillableAI Gemini API Module
// Handles AI summary generation using Gemini API

(function() {
  console.log('🎯 BillableAI: Gemini API module loaded');
  
  // Generate summary using Gemini API with enhanced prompt
  async function generateSummaryWithGemini(emailData, timeSpent) {
    try {
      // Get Gemini API key from localStorage
      const geminiApiKey = window.billableAICore.safeLocalStorageGet('billableai_gemini_api_key');
      if (!geminiApiKey) {
        console.log('🎯 BillableAI: No Gemini API key available, using basic summary');
        return generateBasicSummary(emailData, timeSpent);
      }

      const minutes = Math.floor(timeSpent / 1000 / 60);
      const seconds = Math.floor((timeSpent / 1000) % 60);
      const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      const prompt = `
        You are a legal billing assistant. Generate a professional billable summary for an email composition session.

        EMAIL DETAILS:
        - Recipient: ${emailData.to || 'Not specified'}
        - Subject: ${emailData.subject || 'Not specified'}
        - Content Length: ${emailData.content?.length || 0} characters
        - Time Spent: ${timeFormatted} (${minutes} minutes ${seconds} seconds)
        
        EMAIL CONTENT:
        ${emailData.content || 'No content available'}

        REQUIREMENTS:
        1. Create a concise, professional summary suitable for legal billing
        2. Include the specific work performed (email composition)
        3. Mention key points or topics addressed
        4. Include the exact time spent
        5. Use professional legal billing language
        6. Keep it under 150 words
        
        FORMAT:
        - Brief description of work performed
        - Key points addressed
        - Time allocation
        - Professional tone for client billing

        Generate the summary now:
      `;

      console.log('🎯 BillableAI: Generating Gemini summary for', timeFormatted, 'of work');

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 300,
            topP: 0.8,
            topK: 40
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Summary generation failed';
      
      console.log('🎯 BillableAI: Gemini summary generated successfully');
      
      return {
        timeSpent: timeSpent,
        emailData: emailData,
        summary: summary,
        timestamp: new Date().toISOString(),
        gmailApiUsed: window.billableAIState.gmailApiReady,
        aiGenerated: true,
        timeFormatted: timeFormatted
      };
    } catch (error) {
      console.error('🎯 BillableAI: Error generating Gemini summary:', error);
      return generateBasicSummary(emailData, timeSpent);
    }
  }

  // Generate basic summary as fallback
  function generateBasicSummary(emailData, timeSpent) {
    const minutes = Math.floor(timeSpent / 1000 / 60);
    const seconds = Math.floor((timeSpent / 1000) % 60);
    const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const summary = `
      EMAIL COMPOSITION SUMMARY
      
      Work Performed: Drafted and composed professional email communication
      Recipient: ${emailData.to || 'Not specified'}
      Subject: ${emailData.subject || 'Not specified'}
      Content Length: ${emailData.content?.length || 0} characters
      Time Spent: ${timeFormatted} (${minutes} minutes ${seconds} seconds)
      
      Key Points Addressed: ${emailData.subject || 'Email composition'}
      Time Allocation: ${minutes} minutes for email composition and review
      
      Billing Summary: Professional email communication drafting and composition.
    `;

    return {
      timeSpent: timeSpent,
      emailData: emailData,
      summary: summary,
      timestamp: new Date().toISOString(),
      gmailApiUsed: window.billableAIState.gmailApiReady,
      aiGenerated: false,
      timeFormatted: timeFormatted
    };
  }

  // Generate test summary for testing purposes
  async function generateTestSummary(emailData, timeSpent) {
    try {
      console.log('🎯 BillableAI: Generating test summary for:', emailData);
      
      const minutes = Math.floor(timeSpent / 1000 / 60);
      const seconds = Math.floor((timeSpent / 1000) % 60);
      const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      const prompt = `
        You are a legal billing assistant. Generate a professional billable summary for an email composition session.

        EMAIL DETAILS:
        - Recipient: ${emailData.to}
        - Subject: ${emailData.subject}
        - Content Length: ${emailData.content.length} characters
        - Time Spent: ${timeFormatted} (${minutes} minutes ${seconds} seconds)
        
        EMAIL CONTENT:
        ${emailData.content}

        REQUIREMENTS:
        1. Create a concise, professional summary suitable for legal billing
        2. Include the specific work performed (email composition)
        3. Mention key points or topics addressed
        4. Include the exact time spent
        5. Use professional legal billing language
        6. Keep it under 150 words
        
        FORMAT:
        - Brief description of work performed
        - Key points addressed
        - Time allocation
        - Professional tone for client billing

        Generate the summary now:
      `;

      const geminiApiKey = localStorage.getItem('billableai_gemini_api_key');
      if (!geminiApiKey) {
        throw new Error('No Gemini API key available');
      }

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 300,
            topP: 0.8,
            topK: 40
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const summary = data.candidates[0].content.parts[0].text;
      
      console.log('🎯 BillableAI: Test summary generated:', summary);
      
      // Store in localStorage for the test page to display
      const summaryData = {
        emailData,
        timeSpent,
        timeFormatted,
        summary,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('billableai_test_summary', JSON.stringify(summaryData));
      
      return summary;
    } catch (error) {
      console.error('🎯 BillableAI: Test summary generation failed:', error);
      throw error;
    }
  }

  // Expose Gemini API functions
  window.billableAIGemini = {
    generateSummaryWithGemini,
    generateBasicSummary,
    generateTestSummary
  };

  console.log('🎯 BillableAI: Gemini API module ready');
})(); 