---
title: 'Quick Tip: docx is a zip Archive'
date: 2018-07-14
tags:
    - tips
    - microsoft
---

Microsof Office's `docx` files are actually zip archives with a bunch of XMLs and all the attached media. Super useful, everyone should know it!

When I tell my colleagues, friends, or students about it, they don't take me seriously the first time. So, here we go again. If you have a docx (or xlsx, or pptx) file, you can unzip it with `unzip proj.docx -d proj` or any other unarchiver and get a folder with all the stuff that makes up the document:

![](/images/unzipped-docx.png?invert)

From here, you can:

* quickly grab all the media from  `word/media`
* work with the document (`word/document`) via an XML parser (or grep / sed, but it's a secret)

And do all the other marvellous stuff — no Office or even GUI needed. Now go and spread the light of this newfound knowledge and never complain about docx again!
