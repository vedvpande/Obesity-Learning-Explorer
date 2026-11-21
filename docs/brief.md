# Product brief: Obesity Learning Explorer

## App name

Obesity Learning Explorer

## The problem

Students researching obesity for school struggle to find clear, trustworthy statistics. Official data is buried in long reports and complicated tables, and quick searches often give numbers with no source. They need one simple place to look up, compare and understand adult obesity trends, and to cite them correctly.

## Who it is for

Priya, 15, a Year 10 student writing a health-class report on obesity. She needs her country's adult obesity rate, how it has changed since 1990, and a comparison with another country, all with a source she can cite. The app is strictly for education.

## Main features

1. **Look up a country:** pick a country to see its adult obesity rate, and "Copy this fact" as a sentence with its year and source.
2. **Trend chart:** a line chart of that country's rate from 1990 to 2022.
3. **Compare two countries:** both lines on the same chart.
4. **Ranking table:** every country in a table, sorted by clicking a column heading.
5. **Learn page:** what an "obesity rate" measures, common causes and how to cite, in plain language.
6. **My Report:** signed-in students save facts with a short note and copy all their citations at once.

Later in the course (supporting work, not extra features): public pages need no sign-in; a database; anonymous analytics of which countries are looked up most; a Stripe test-mode "Support this project" button.

## Not included

- A BMI calculator, or anywhere to enter personal height, weight or health details
- Diet, exercise or weight-loss advice
- Live data from the internet (the data is built into the app)
- Maps (maybe a stretch goal)
- Children's or teenagers' obesity data, which is measured differently

## Data the app will store

- **Obesity rates:** yearly adult (18+) rates (%) by country, 1990–2022. For now these are example numbers shaped like public WHO figures, and the app says so. Later, real public data from the data file in `data/`, always with its source.
- **Saved facts (My Report):** country, year, rate, source and a short note. Never personal health information.
- **Sign-in:** the student's name and email from Google, used only to keep their saved facts private.
- **Analytics:** counts of which countries are looked up. Nothing personal.

No real patient data and no personal health data, ever.

## Health, privacy or safety risks and how I handle them

- **Misreading a number:** every number shows what it measures (adults 18+), the year and the source.
- **Stigma or hurtful wording:** person-first language ("people with obesity"), neutral colours instead of red "danger" styling, and no before/after or body-shaming images.
- **Triggering eating disorders:** no calorie targets, weight-loss goals or "ideal weight" numbers. The Learn page links to a support service.
- **Under-18 users:** sign-in stores only name and email, each user sees only their own saved facts, and analytics never records personal or health information.
- **Not medical advice:** the app never diagnoses, calculates doses or gives treatment advice, and every page shows a disclaimer.

## How I will know it works

- **Accurate:** for 5 chosen country-and-year pairs, the number on screen and in the chart exactly matches the data file.
- **Useful:** 3 student testers can, without help and in under 3 minutes, find one country's rate, compare it with another, and say whether it went up or down since 1990.
- **Citable:** every copied fact includes the country, year, rate and source.
- **Works everywhere:** on a phone and a laptop, in light and dark mode, with no errors in the browser console.
- **Private:** tested with two accounts, each user sees only their own saved facts, and analytics events contain nothing personal.
