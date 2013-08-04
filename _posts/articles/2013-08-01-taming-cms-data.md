---
layout: article
title: Taming the Medicare Provider Charge Data
author_twitter: hydrologee
author: James Seppi
categories: 
  - articles
published: false
---

Earlier this year, the [Centers for Medicare and Medicaid Services (CMS)](www.cms.gov) released a great dataset - the [Medicare Provider Charge Data](http://www.cms.gov/Research-Statistics-Data-and-Systems/Statistics-Trends-and-Reports/Medicare-Provider-Charge-Data/index.html) for the top 100 most common inpatient services and the top 30 outpatient services. These data are quite interesting, as they show how in most cases, health service providers (ie hospitals), bill extremely variable charges to Medicare, but are reimbursed only a fraction of those charges. The reasoning behind hospital charges is a dark and mysterious art, and way out of my expertise, so I won't go any further into saying whether or not those charges are reasonable.

The CMS charge data are released as Excel and CSV files, which for a dataset containing data for all Medicare-accepting hospitals/providers in the country, are pretty difficult formats to work with.

Some numbers for you so you get an idea of the size of this dataset:

- 100 outpatient services (by Diagnosis Related Group [DRG] code)
- 30 inpatient services (by Ambulatory Payment Classification [APC] code)
- 3,337 health care providers
- 163,065 records of inpatient service average charges and payments
- 41,175 records of outpatient service average charges and payments

You can check out my [load-cms-data project](https://github.com/jseppi/load-cms-data) on Github or just [download a zip](https://github.com/jseppi/load-cms-data/archive/master.zip) of the code and the resulting database.