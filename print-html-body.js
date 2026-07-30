import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('stage_page.html', 'utf8');
const $ = cheerio.load(html);

// Remove scripts and styles
$('script').remove();
$('style').remove();

console.log("=== HTML Visible Content ===");
console.log($('body').text().trim().replace(/\s+/g, ' ').substring(0, 2000));

console.log("\n=== HTML Structure (Divs with class or ID) ===");
$('div').each((i, el) => {
    const id = $(el).attr('id');
    const klass = $(el).attr('class');
    const text = $(el).text().trim().substring(0, 50);
    if (id || klass || text) {
        console.log(`Div ${i}: id="${id || ''}" class="${klass || ''}" -> text snippet: "${text.replace(/\s+/g, ' ')}"`);
    }
});
