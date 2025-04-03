import { parseCSV } from '../../lib/csvParser';
import { DateTime } from 'luxon';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, context } = req.body;

    if (!name && !context) {
      return res.status(400).json({ message: 'Please provide at least one search parameter' });
    }

    const data = await parseCSV();

    // Filter results based on search parameters
    const filteredResults = data.filter(item => {
      let nameMatch = true;
      if (name) {
        nameMatch = false;
        if (item.parties) {
          try {
            const parties = typeof item.parties === 'string' 
              ? JSON.parse(item.parties) 
              : item.parties;

            if (Array.isArray(parties)) {
              nameMatch = parties.some(party => 
                party && party.name && party.name.toLowerCase().includes(name.toLowerCase())
              );
            }
          } catch (error) {
            console.error('Error parsing parties:', error);
          }
        }
      }

      let contextMatch = true;
      if (context) {
        contextMatch = false;

        // Try to match in content field first
        if (item.content) {
          let contentObj;
          try {
            contentObj = typeof item.content === 'string' 
              ? JSON.parse(item.content) 
              : item.content;
            
            // Search in brief
            if (contentObj.brief && contentObj.brief.toLowerCase().includes(context.toLowerCase())) {
              contextMatch = true;
            }
            
            // Search in topics names
            else if (contentObj.topics && Array.isArray(contentObj.topics)) {
              const topicMatch = contentObj.topics.some(topic => 
                topic.name && topic.name.toLowerCase().includes(context.toLowerCase())
              );
              if (topicMatch) contextMatch = true;
            }
            
            // Search in outline text
            else if (contentObj.outline && Array.isArray(contentObj.outline)) {
              const outlineMatch = contentObj.outline.some(section => 
                (section.items && Array.isArray(section.items) && 
                 section.items.some(item => 
                   item.text && item.text.toLowerCase().includes(context.toLowerCase())
                 )) ||
                (section.section && section.section.toLowerCase().includes(context.toLowerCase()))
              );
              if (outlineMatch) contextMatch = true;
            }
          } catch (error) {
            console.error('Error parsing content for search:', error);
          }
        }
        
        // Fall back to context search if no match found in content
        if (!contextMatch) {
          if (item.context && typeof item.context === 'object' && item.context.brief) {
            contextMatch = item.context.brief.toLowerCase().includes(context.toLowerCase());
          } 
          else if (item.context && typeof item.context === 'string') {
            try {
              const parsedContext = JSON.parse(item.context);
              if (parsedContext.brief) {
                contextMatch = parsedContext.brief.toLowerCase().includes(context.toLowerCase());
              } else {
                contextMatch = item.context.toLowerCase().includes(context.toLowerCase());
              }
            } catch (e) {
              contextMatch = item.context.toLowerCase().includes(context.toLowerCase());
            }
          }
        }
      }

      return nameMatch && contextMatch;
    });

    // Format results to return necessary information with Recording link
    const formattedResults = filteredResults.map(item => {
      let participants = [];
      
      try {
          const parties = typeof item.parties === 'string' 
              ? JSON.parse(item.parties) 
              : item.parties;
  
          if (Array.isArray(parties)) {
              participants = parties.map(party => party.name).filter(Boolean);
          }
      } catch (error) {
          console.error('Error parsing parties for result formatting:', error);
      }
  
      let brief = '';
      let topics = [];
      let outline = '';
  
      if (item.content) {
          try {
              const contentObj = typeof item.content === 'string' 
                  ? JSON.parse(item.content) 
                  : item.content;
  
              brief = contentObj.brief || '';
  
              if (contentObj.topics && Array.isArray(contentObj.topics)) {
                  topics = contentObj.topics.map(topic => topic.name).filter(Boolean);
              }
  
              if (contentObj.outline && Array.isArray(contentObj.outline)) {
                  outline = contentObj.outline
                      .flatMap(section => section.items.map(i => i.text)) 
                      .join('\n');
              }
          } catch (error) {
              console.error('Error parsing content for result formatting:', error);
          }
      }
  
      const resultId = item.extractedId || item.id;
      const recordingUrl = `https://drive.google.com/drive/search?q=title:${resultId}.mp4%20type:video`;
      
      let formattedDate = 'Unknown';
      if (item.scheduled) {
        try {
          formattedDate = DateTime.fromISO(item.scheduled, { zone: 'utc' })
            .setZone('America/New_York')
            .toFormat('MM-dd-yyyy, hh:mm a');
        } catch (error) {
          console.error('Error formatting date:', error);
        }
      }
  
      return {
          id: resultId,
          title: item.title || `Call ID: ${resultId}`,
          participants,
          brief,
          topics: topics.join(', '),
          outline, 
          recording: recordingUrl,
          scheduled: formattedDate
      };
  });

    res.status(200).json(formattedResults);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error processing search request', error: error.message });
  }
}
