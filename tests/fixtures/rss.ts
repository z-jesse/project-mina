export const testFeed = `<?xml version="1.0"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">
<channel><title>Test news</title><link>https://www.eurogamer.net</link><description>Synthetic test feed</description>
<item><title>Test game gets a release date</title><link>https://www.eurogamer.net/mina-test-announcement?utm_source=rss#comments</link>
<guid>mina-test-guid</guid><pubDate>Fri, 25 Sep 2026 10:30:00 +0200</pubDate><dc:creator>Test Reporter</dc:creator>
<description><![CDATA[<p>A short <b>publisher</b> description &amp; details.</p><p>Read more</p>]]></description>
<media:content medium="image" url="https://images.example.com/test.jpg"/>
<content:encoded xmlns:content="http://purl.org/rss/1.0/modules/content/"><![CDATA[Full article body must never be stored.]]></content:encoded>
</item></channel></rss>`

export const pcGamerFeed = testFeed
  .replaceAll('www.eurogamer.net', 'www.pcgamer.com')
  .replace('medium="image"', 'type="image/jpeg"')

export const vgcFeed = testFeed
  .replaceAll('www.eurogamer.net', 'www.videogameschronicle.com')
  .replace(/<media:content[^>]+\/>/, '')
  .replace(
    '<p>A short',
    '<img src="https://images.example.com/vgc.jpg?width=800&amp;quality=80"><p>A short',
  )
