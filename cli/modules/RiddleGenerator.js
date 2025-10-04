/**
 * RiddleGenerator - Creates riddles using AI integration
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export class RiddleGenerator {
    /**
     * Generates riddles for a list of words
     * @param {Array} words - Array of 4-letter words
     * @param {string} language - Language code (e.g., 'en', 'he')
     * @returns {Promise<Array>} - Array of riddle objects
     */
    static async generateRiddles(words, language = 'en') {
        const riddles = [];

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            console.log(`Generating riddle for word: ${word}`);

            try {
                const riddle = await this.generateRiddle(word, language, i);
                riddles.push(riddle);
            } catch (error) {
                console.warn(`Failed to generate AI riddle for "${word}", using fallback`);
                const fallbackRiddle = this.generateFallbackRiddle(word, language, i);
                riddles.push(fallbackRiddle);
            }
        }

        return riddles;
    }

    /**
     * Generates a single riddle for a word
     * @param {string} word - The word to create a riddle for
     * @param {string} language - Language code
     * @param {number} index - Riddle index (0-3)
     * @returns {Promise<Object>} - Riddle object
     */
    static async generateRiddle(word, language, index) {
        const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
            console.warn('No API key found, using fallback riddles');
            return this.generateFallbackRiddle(word, language, index);
        }

        // Determine which API to use
        if (process.env.OPENAI_API_KEY) {
            return await this.generateOpenAIRiddle(word, language, index);
        } else if (process.env.ANTHROPIC_API_KEY) {
            return await this.generateAnthropicRiddle(word, language, index);
        }

        return this.generateFallbackRiddle(word, language, index);
    }

    /**
     * Generates a riddle using OpenAI API
     * @param {string} word - The word
     * @param {string} language - Language code
     * @param {number} index - Riddle index
     * @returns {Promise<Object>} - Riddle object
     */
    static async generateOpenAIRiddle(word, language, index) {
        const prompt = this.getPromptTemplate(word, language);
        const model = process.env.OPENAI_MODEL || 'gpt-4';

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        {
                            role: 'system',
                            content: `You are an expert riddle writer who creates clear, solvable riddles in ${language === 'he' ? 'Hebrew' : 'English'}. Your riddles should be straightforward descriptions that help players deduce the answer through logical thinking, not cryptic wordplay. The riddles must describe REAL words with actual meanings - verify the word exists and has a clear definition before creating the riddle. Always provide helpful hints and explanations. Respond ONLY with valid JSON in the exact format requested, with no markdown formatting or extra text.`
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 200,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const data = await response.json();
            let content = data.choices[0].message.content.trim();

            // Try to parse as JSON
            let riddleData;
            try {
                // Remove markdown code blocks if present
                content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');

                // Try to extract JSON if it's embedded in text
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    content = jsonMatch[0];
                }

                riddleData = JSON.parse(content);

                // Validate that we have the required fields
                if (!riddleData.riddle || !riddleData.hint || !riddleData.explanation) {
                    throw new Error('Missing required fields in JSON response');
                }
            } catch (e) {
                // Fallback: use template-based riddle
                console.warn(`AI did not return valid JSON for "${word}": ${e.message}`);
                return this.generateFallbackRiddle(word, language, index);
            }

            return {
                id: index + 1,
                prompt: riddleData.riddle,
                answer: word,
                position: index,
                hint: riddleData.hint,
                explanation: riddleData.explanation
            };
        } catch (error) {
            console.error(`OpenAI API error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generates a riddle using Anthropic API
     * @param {string} word - The word
     * @param {string} language - Language code
     * @param {number} index - Riddle index
     * @returns {Promise<Object>} - Riddle object
     */
    static async generateAnthropicRiddle(word, language, index) {
        const prompt = this.getPromptTemplate(word, language);
        const model = process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229';

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model,
                    max_tokens: 200,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`Anthropic API error: ${response.status}`);
            }

            const data = await response.json();
            const content = data.content[0].text.trim();

            // Try to parse as JSON
            let riddleData;
            try {
                riddleData = JSON.parse(content);
            } catch (e) {
                // Fallback: treat as plain text riddle
                console.warn('AI did not return JSON, using text as riddle');
                riddleData = {
                    riddle: content,
                    hint: `Starts with ${word[0]}`,
                    explanation: `The answer is ${word}`
                };
            }

            return {
                id: index + 1,
                prompt: riddleData.riddle,
                answer: word,
                position: index,
                hint: riddleData.hint,
                explanation: riddleData.explanation
            };
        } catch (error) {
            console.error(`Anthropic API error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Gets the appropriate prompt template for the language
     * @param {string} word - The word
     * @param {string} language - Language code
     * @returns {string} - Prompt text
     */
    static getPromptTemplate(word, language) {
        const templates = {
            en: `Create a riddle for the word "${word}".

CRITICAL REQUIREMENTS:
- The riddle MUST describe the word's actual meaning, function, or characteristics
- Use clear, descriptive language that helps players deduce the answer logically
- AVOID wordplay, puns, letter counting, rhymes, or cryptic metaphors
- Keep the riddle concise (8-15 words) but informative
- The hint should provide additional context or a different angle (5-10 words)
- The explanation should clarify why the answer fits the riddle (10-25 words)

EXAMPLES OF GOOD RIDDLES:
- For "TREE": "A tall plant with a woody trunk, branches, and leaves"
- For "BOOK": "Bound pages containing written or printed text for reading"
- For "RAIN": "Water falling from clouds in drops to the ground"

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "riddle": "your clear, descriptive riddle here",
  "hint": "your helpful hint here",
  "explanation": "your explanation of why this answer is correct"
}`,
            he: `צור חידה למילה "${word}".

דרישות קריטיות:
- החידה חייבת לתאר את המשמעות, התפקיד או המאפיינים האמיתיים של המילה
- השתמש בשפה ברורה ותיאורית שעוזרת לשחקנים להסיק את התשובה באופן לוגי
- הימנע מחרוזים, ספירת אותיות או מטאפורות מסתוריות
- שמור על החידה תמציתית (8-15 מילים) אך אינפורמטיבית
- הרמז צריך לספק הקשר נוסף או זווית שונה (5-10 מילים)
- ההסבר צריך להבהיר למה התשובה מתאימה לחידה (10-25 מילים)

דוגמאות לחידות טובות:
- עבור "עץ": "צמח גבוה עם גזע עצי, ענפים ועלים"
- עבור "ספר": "דפים כרוכים המכילים טקסט כתוב או מודפס לקריאה"
- עבור "גשם": "מים היורדים מעננים בטיפות אל הקרקע"

השב רק עם JSON תקין בפורמט הזה בדיוק (ללא markdown, ללא טקסט נוסף):
{
  "riddle": "החידה הברורה והתיאורית שלך כאן",
  "hint": "הרמז המועיל שלך כאן",
  "explanation": "ההסבר שלך למה התשובה הזו נכונה"
}`
        };

        return templates[language] || templates.en;
    }

    /**
     * Generates a fallback riddle using templates
     * @param {string} word - The word
     * @param {string} language - Language code
     * @param {number} index - Riddle index
     * @returns {Object} - Riddle object
     */
    static generateFallbackRiddle(word, language, index) {
        const templates = {
            en: [
                {
                    riddle: `A four-letter word that starts with ${word[0]} and ends with ${word[3]}`,
                    hint: `Think of common words with these letters`,
                    explanation: `The word "${word}" matches the pattern with ${word[0]} at the start and ${word[3]} at the end`
                },
                {
                    riddle: `Find the word: ${word[0]}_${word[2]}_`,
                    hint: `The missing letters are ${word[1]} and ${word[3]}`,
                    explanation: `Filling in the blanks gives you "${word}"`
                },
                {
                    riddle: `This word begins with "${word[0]}" and contains "${word[1]}"`,
                    hint: `Look for the pattern ${word[0]}${word[1]}`,
                    explanation: `The word "${word}" starts with ${word[0]} and has ${word[1]} as the second letter`
                },
                {
                    riddle: `A word with letters ${word[0]}, ${word[1]}, ${word[2]}, ${word[3]}`,
                    hint: `These letters appear in this exact order`,
                    explanation: `The letters spell out "${word}" when arranged in sequence`
                }
            ],
            he: [
                {
                    riddle: `מילה בת ארבע אותיות שמתחילה ב-${word[0]} ומסתיימת ב-${word[3]}`,
                    hint: `חשוב על מילים נפוצות עם האותיות האלה`,
                    explanation: `המילה "${word}" מתאימה לתבנית עם ${word[0]} בהתחלה ו-${word[3]} בסוף`
                },
                {
                    riddle: `מצא את המילה: ${word[0]}_${word[2]}_`,
                    hint: `האותיות החסרות הן ${word[1]} ו-${word[3]}`,
                    explanation: `מילוי החסר נותן לך "${word}"`
                },
                {
                    riddle: `מילה זו מתחילה ב-"${word[0]}" ומכילה "${word[1]}"`,
                    hint: `חפש את התבנית ${word[0]}${word[1]}`,
                    explanation: `המילה "${word}" מתחילה ב-${word[0]} ויש לה ${word[1]} כאות שנייה`
                },
                {
                    riddle: `מילה עם האותיות ${word[0]}, ${word[1]}, ${word[2]}, ${word[3]}`,
                    hint: `האותיות האלה מופיעות בסדר הזה בדיוק`,
                    explanation: `האותיות מרכיבות את "${word}" כשמסודרות ברצף`
                }
            ]
        };

        const languageTemplates = templates[language] || templates.en;
        const template = languageTemplates[index % languageTemplates.length];

        return {
            id: index + 1,
            prompt: template.riddle,
            answer: word,
            position: index,
            hint: template.hint,
            explanation: template.explanation
        };
    }

    /**
     * Implements retry logic with exponential backoff
     * @param {Function} fn - Function to retry
     * @param {number} maxRetries - Maximum number of retries
     * @param {number} baseDelay - Base delay in milliseconds
     * @returns {Promise} - Result of the function
     */
    static async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === maxRetries - 1) {
                    throw error;
                }

                const delay = baseDelay * Math.pow(2, i);
                console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
}
