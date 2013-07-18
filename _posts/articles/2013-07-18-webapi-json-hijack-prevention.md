---
layout: article
title: Preventing JSON Hijacking with ASP.NET MVC4 WebApi
author_twitter: hydrologee
author: James Seppi
categories:
- articles
published: true
---

## What is JSON Hijacking?

Basically, a malicious site can GET sensitive JSON data fetched from your site, and send it to another
server through some trickery with the Array prototype.

See this [article by Phil Haack](http://haacked.com/archive/2008/11/20/anatomy-of-a-subtle-json-vulnerability.aspx)
for a nice explanation.

## Preventing the Vulnerability in WebApi Responses

The simplest way to prevent this vulnerability is to not allow GET access to sensitive data, 
instead using only POST. However, this breaks the semantics of HTTP, so perhaps might not
be desirable to you.

Another method you can use is to only return JSON objects, never bare arrays. 
Any time your client code expects an array, it would have to be extracted from the response. 

The method detailed in this post is appending some cruft to the response, before the JSON array.
This cruft will foil the method that is immediately executed on the sensitive response because
it results in invalid JavaScript.

First, create a new class that derives from `System.Net.Http.Formatting.JsonMediaTypeFormatter`
and override the `WriteToStreamAsync` method, as shown below. The override method
checks for types that will be serialized into JSON arrays, and writes a special set of bytes
at the beginning of the output stream. I use the string `")]}',\n"` because my client-side application
is built on [AngularJS](http://angularjs.org), which has a responseInterceptor that automatically 
removes that special string in any JSON response (see [here](http://docs.angularjs.org/api/ng.$http#jsonvulnerabilityprotection)). Your client code will have to do the same before parsing the response.

    public class ProtectedJsonMediaTypeFormatter : JsonMediaTypeFormatter
    {
        public override Task WriteToStreamAsync(Type type, object value, 
            Stream writeStream, HttpContent content, TransportContext transportContext)
        {
            //If we have a type that will be serialized into a JSON array
            if (typeof(IEnumerable).IsAssignableFrom(type))
            {
                var writer = new StreamWriter(writeStream);
                writer.Write(")]}',\n");
                writer.Flush();
            }
            return base.WriteToStreamAsync(type, value, writeStream, content, transportContext);
        }
    }


Then, in your `WebApiConfig` class, add the following lines to the `Register` method: 

    //Remove default JsonFormatter and add the protected formatter
    config.Formatters.Remove(config.Formatters.JsonFormatter);
    config.Formatters.Add(new ProtectedJsonMediaTypeFormatter());