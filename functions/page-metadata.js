const got = require('got');
const jsdom = require("jsdom")
const { JSDOM } = jsdom


exports.handler = async function(event) {
  var url = event.queryStringParameters.url ? event.queryStringParameters.url : ''
  if (!url) {
    return {
      statusCode: 404,
      body: JSON.stringify({err: 1404, message: 'url is a mandatory parameter'}),
    };
  }

   const extract = (dom)=> {    
    var props = {}
    const ogs = ['url','title','description','site_name','type','image','image:secure_url', 'image:type', 'image:width', 'image:height','image:alt','article:published_time','locale']
    ogs.map (og => {
      props[og.replace(':','_')] = dom.window.document.querySelector("meta[property='og:"+og+"']") ? dom.window.document.querySelector("meta[property='og:"+og+"']").getAttribute('content') : ''
    })
  
    ogs.map (og => {
      if (props[og.replace(':','_')] == '') {props[og.replace(':','_')] = dom.window.document.querySelector("meta[name='og:"+og+"']") ? dom.window.document.querySelector("meta[name='og:"+og+"']").getAttribute('content') : '' }
    })
  
    props['article_tags'] = []
  
    dom.window.document.querySelectorAll("meta[property='article:tag']").forEach(tag => {
      props['article_tags'].push(tag.content)
    })
  
    props['article_published_time'] = dom.window.document.querySelector("meta[property='article:published_time']") ? dom.window.document.querySelector("meta[property='article:published_time']").getAttribute('content') : ''
  
    props['article_modified_time'] = dom.window.document.querySelector("meta[property='article:modified_time']") ? dom.window.document.querySelector("meta[property='article:modified_time']").getAttribute('content') : ''
  
    props['reading_time'] = dom.window.document.querySelector("meta[name='twitter:data1']") ? dom.window.document.querySelector("meta[name='twitter:data1']").getAttribute('value') : ''
  
    props['site_icon'] = dom.window.document.querySelector("link[rel='icon']") ? dom.window.document.querySelector("link[rel='icon']").getAttribute('href') : ''
  
    props['site_icon_type'] = dom.window.document.querySelector("link[rel='icon']") ? dom.window.document.querySelector("link[rel='icon']").getAttribute('type') : ''
  
    if (props['description'] == '' ) {props['description'] = dom.window.document.querySelector("meta[name='description']") ? dom.window.document.querySelector("meta[name='description']").getAttribute('content') : ''}
  
    //props['length'] = response.body.length
  
    props['author'] = {},  props['publisher'] = {},  props['date'] = {}
    props['meta_description'] = '', props['keywords'] =[]
    props['isAccessibleForFree'] = ''
    var meta = {}
    
    //console.log(props['url'])
    //console.log(dom.window.document.querySelector("script[type='application/ld+json']").text)
    if (dom.window.document.querySelector("script[type='application/ld+json']")) {
      try {
        meta=JSON.parse(dom.window.document.querySelector("script[type='application/ld+json']").text)
      }
      catch {
        meta = {}
      }
    }
    //const meta = dom.window.document.querySelector("script[type='application/ld+json']") ? JSON.parse(dom.window.document.querySelector("script[type='application/ld+json']").text.replace(/&#x27;/g,'"')) : null
    if (meta) {
      if (meta['author'] && meta['author']['image']) {
        meta['author']['image']['type']= meta['author']['image']['@type']
        delete meta['author']['image']['@type']
      }
      if (meta['author'] ) {
        meta['author']['type']= meta['author']['@type']
        delete meta['author']['@type']
      }
      if (meta['publisher'] &&  meta['publisher']['logo']) {
        meta['publisher']['logo']['type']= meta['publisher']['logo']['@type']
        delete meta['publisher']['logo']['@type']
      }
      if (meta['publisher']) {
        meta['publisher']['type']= meta['publisher']['@type']
        delete meta['publisher']['@type']
      }
      props['author'] = meta.author ? meta.author : {}
      props['publisher'] = meta.publisher ? meta.publisher : {}
      if (meta.dateCreated) {props['date']['created'] = meta.dateCreated}
      if (meta.datePublished) {props['date']['published'] = meta.datePublished}
      if (meta.dateModified) {props['date']['modified'] = meta.dateModified}
      props['meta_description'] = meta.description ? meta.description : ''
      props['keywords'] = meta.keywords ? meta.keywords : []
      props['isAccessibleForFree'] = meta.hasPart ? meta.hasPart.isAccessibleForFree ? meta.hasPart.isAccessibleForFree : '' : ''
    } 
    return props
  }

   return got(url)
          .then(res => {
            const dom = new JSDOM(res.body)
            //extract(dom)
            return extract(dom)
            //return res.body
          })
          .then(data => ({
            statusCode: 200,
            body: JSON.stringify(data)
          }))
          .catch(error => ({ statusCode: 422, body: String(error) }));
}