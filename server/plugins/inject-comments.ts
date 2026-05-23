export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response) => {
    // Only process HTML responses
    if (typeof response.body === 'string' && response.body.startsWith('<!DOCTYPE html>')) {
      // Insert our comments at the very top of the HTML document
      response.body = `<!--
  Site by: https://raffi.website
  Code by: Raffi Keklikian
  Design by: PS 260
-->
${response.body}`
    }
  })
})