---
layout: article
title: Taming the Medicare Provider Charge Data
author_twitter: hydrologee
author: James Seppi
categories: 
  - articles
published: true
---

Earlier this year, the [Centers for Medicare and Medicaid Services (CMS)](www.cms.gov) released a great dataset - the [Medicare Provider Charge Data](http://www.cms.gov/Research-Statistics-Data-and-Systems/Statistics-Trends-and-Reports/Medicare-Provider-Charge-Data/index.html) for the top 100 most common inpatient services and the top 30 outpatient services. These data are quite interesting, as they show how in most cases, health service providers (ie hospitals), bill extremely variable charges to Medicare, but are reimbursed only a fraction of those charges. The reasoning behind hospital charges is a dark and mysterious art, and way out of my expertise, so I won't go any further into saying whether or not those charges are reasonable.

The CMS charge data are released as Excel and CSV files, which for a dataset containing data for all Medicare-accepting hospitals/providers in the country, are pretty difficult formats to work with (and are completely denormalized).

I wrote some relatively quick-and-dirty Python scripts to parse the CMS charge data into a more developer-friendly and queryable format - a database. These scripts can be found in my [load-cms-data project on Github](https://github.com/jseppi/load-cms-data). The first script - `create_cms_db.py` - creates a new sqlite database schema to hold the CMS data. The second script - `load_cms_data.py` - reads the CSV data files, parses the data, and inserts it into the database created by the first script.  Note you can just run `python load_cms_data.py -d <DATABSENAME>` to both create the database and load the CMS data into it.

In addition to the charge data available from CMS, I also augmented the dataset by linking health care providers to their Hospital Referral Region (HRR) and Hospital Service Area (HSA) using the 2011 Zip-to-HRR-HSA crosswalk from the Dartmouth Atlas (available [here](http://www.dartmouthatlas.org/downloads/geography/ZipHsaHrr11.xls)). Linking the providers to these regions allows more meaningful aggregation and comparison of service charges and payments with hospitals in the same regions. The [Dartmouth Atlas of Health Care](http://www.dartmouthatlas.org/) has some other great health care-related datasets, so check them out if you are interested.

Here are some quick numbers from the dataset:

- 100 outpatient services (by Diagnosis Related Group [DRG] code)
- 30 inpatient services (by Ambulatory Payment Classification [APC] code)
- 3,337 health care providers
- 163,065 records of inpatient service average charges and payments
- 41,175 records of outpatient service average charges and payments
- Highest average inpatient charge was $929,119 for DRG 207 - "Respiratory System Diagnosis with Ventilator Support for 96+ Hours" at Stanford Hospital in California.
- Highest average outpatient charge was $32,105 for APC 74 - "Level IV Endoscopy Upper Airway" at Fort Walton Beach Medical Center in Florida

You can check out my [load-cms-data project](https://github.com/jseppi/load-cms-data) on Github or just [download a zip](https://github.com/jseppi/load-cms-data/archive/master.zip) of the code and the resulting database.  

For a neat tool that I built with these data, <s>check out my site Health Cost Negotiator</s>. The goal of the site is to help uninsured or under-insured people negotiate their health care charges with their providers. Users can find what providers were paid by Medicare (typically much less than the amount originally charged) for the same procedure and hopefully use that information to start as a baseline for negotitations.