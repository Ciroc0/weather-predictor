fetch('https://weather-predictor-eta.vercel.app/')
  .then(r => r.text())
  .then(html => {
    console.log('=== HTML ANALYSIS ===');
    console.log('Length:', html.length, 'chars');
    console.log('Has #root:', html.includes('id="root"') ? 'YES' : 'NO');
    console.log('Has script:', html.includes('<script') ? 'YES' : 'NO');
    console.log('Has loading:', html.includes('Indlæser') ? 'YES' : 'NO');
    
    // Find JS and CSS files
    const jsMatch = html.match(/src="([^"]+\.js)"/);
    const cssMatch = html.match(/href="([^"]+\.css)"/);
    
    console.log('JS file:', jsMatch ? jsMatch[1] : 'NOT FOUND');
    console.log('CSS file:', cssMatch ? cssMatch[1] : 'NOT FOUND');
    
    // Show start of HTML
    console.log('\nFirst 300 chars:');
    console.log(html.substring(0, 300));
  });
