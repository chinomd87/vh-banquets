const RunwayML = require('@runwayml/sdk');
require('dotenv').config();

// Initialize Runway ML client
const runway = new RunwayML({
  apiKey: process.env.RUNWAY_API_TOKEN
});

async function testRunwayResponse() {
  console.log('Testing Runway response structure...');
  
  const testImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD1+iiigAooooAKKKKACiiigAooooA//9k=";
  
  try {
    const task = await runway.imageToVideo
      .create({
        model: 'gen4_turbo',
        promptImage: testImage,
        promptText: 'Test animation',
        ratio: '1280:720',
        duration: 5,
      })
      .waitForTaskOutput();

    console.log('=== FULL TASK OBJECT ===');
    console.log(JSON.stringify(task, null, 2));
    
    console.log('=== TASK PROPERTIES ===');
    console.log('Object.keys(task):', Object.keys(task));
    
    if (task.output) {
      console.log('=== OUTPUT PROPERTIES ===');
      console.log('Object.keys(task.output):', Object.keys(task.output));
      console.log('task.output:', task.output);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testRunwayResponse();
