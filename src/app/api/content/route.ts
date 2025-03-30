import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for content (in a real app, you'd use a database)
let contentStore: any = {
  siteVerifiedContent: null,
  siteTagline: null,
  siteSkills: null,
  siteProjects: null,
  uploadedImages: null,
  lastUpdated: Date.now()
};

export async function GET() {
  return NextResponse.json(contentStore);
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data || !data.type) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing data type' 
      }, { status: 400 });
    }
    
    // Validate content based on type
    if (data.content === undefined) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing content data' 
      }, { status: 400 });
    }
    
    // Update the content store with the new data
    if (data.type === 'siteVerifiedContent' && data.content) {
      contentStore.siteVerifiedContent = data.content;
    } else if (data.type === 'siteTagline' && data.content) {
      contentStore.siteTagline = data.content;
    } else if (data.type === 'siteSkills' && data.content) {
      contentStore.siteSkills = data.content;
    } else if (data.type === 'siteProjects' && data.content) {
      // Validate siteProjects content
      try {
        // Make sure it's a valid JSON string
        if (typeof data.content === 'string') {
          // Try to parse it to validate
          const parsed = JSON.parse(data.content);
          
          // Make sure it's an array
          if (!Array.isArray(parsed)) {
            throw new Error('Projects data must be an array');
          }
          
          // Store the valid data
          contentStore.siteProjects = data.content;
        } else {
          // If it's not a string, stringify it
          contentStore.siteProjects = JSON.stringify(data.content);
        }
      } catch (error) {
        console.error('Invalid projects data:', error);
        return NextResponse.json({ 
          success: false, 
          message: 'Invalid projects data format' 
        }, { status: 400 });
      }
    } else if (data.type === 'uploadedImages' && data.content) {
      contentStore.uploadedImages = data.content;
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Unknown content type or empty content' 
      }, { status: 400 });
    }
    
    // Update the timestamp
    contentStore.lastUpdated = Date.now();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Content updated successfully',
      lastUpdated: contentStore.lastUpdated
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update content: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}
