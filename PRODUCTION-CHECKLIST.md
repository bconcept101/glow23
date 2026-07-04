# Glow 23 Production Checklist

This checklist tracks the production progress for the Glow 23 live Telegram entertainment number game interface.

## Project Separation

- [x] Created separate GitHub repository for Glow 23
- [x] Kept Glow 23 separate from the Lotto Number Generator website
- [x] Planned Glow 23 for separate Cloudflare Pages deployment
- [ ] Deploy Glow 23 as its own Cloudflare Pages project
- [ ] Confirm free Cloudflare Pages domain is working

## Core Game Setup

- [x] Project name locked as Glow 23
- [x] Main number name locked as Glow Number
- [x] Bonus number name locked as Glow Ball
- [x] Glow Number range locked at 1–23
- [x] Glow Ball range locked at 1–20
- [x] Three daily rounds added
- [x] Round 1 window set to 12:00 PM – 1:00 PM
- [x] Round 2 window set to 3:00 PM – 5:00 PM
- [x] Round 3 window set to 7:00 PM – 10:00 PM
- [x] 10-minute cutoff rule added before each round

## Star Pricing

- [x] Glow Number set to 385 Stars / $5
- [x] Glow Ball add-on set to 155 Stars / $2
- [x] Glow Number + Glow Ball set to 540 Stars / $7

## Win Structure

- [x] Glow Number win full return set to 1,925 Stars / $25
- [x] Glow Number + Glow Ball full return set to 2,695 Stars / $35
- [x] 7% cash-out reserve added
- [x] 3% hosting and maintenance reserve added
- [x] 10% total reserve deducted from winning returns
- [x] Glow Number final payout set to 1,732 Stars
- [x] Glow Number + Glow Ball final payout set to 2,425 Stars

## Member Rules

- [x] Members may purchase multiple Glow Numbers per round
- [x] Each individual Glow Number may be purchased up to three times per member, per round
- [x] Example rule added for Glow Number 7, 12, and 19

## Front-End Interface

- [x] Created `index.html`
- [x] Created `styles.css`
- [x] Created `app.js`
- [x] Created live page structure
- [x] Added side menu
- [x] Added live game section
- [x] Added 3D chamber layout
- [x] Added animated balls
- [x] Added drawn ball pop-up preview
- [x] Added current round panel
- [x] Added countdown timer
- [x] Added Star placement cutoff status
- [x] Added today’s results section
- [x] Added previous results search section
- [x] Added rules section

## Results System

- [x] Created `data/results.json`
- [x] Added sample previous results
- [x] Connected side menu search to `data/results.json`
- [x] Today’s results remain visible after each round begins
- [x] Result timestamps are displayed
- [ ] Replace demo/generated results with official secure results
- [ ] Add automatic result saving
- [ ] Add permanent result archive
- [ ] Add admin-only result controls

## Security Notes

- [x] Added note that Phase 1 is front-end/static only
- [x] Added note that browser JavaScript should not control final official results
- [ ] Add secure backend or Cloudflare Function for official result generation
- [ ] Add database storage
- [ ] Add admin authentication
- [ ] Add anti-tampering logic
- [ ] Add private admin dashboard

## Telegram Future Setup

- [ ] Create official Telegram channel
- [ ] Create official Telegram group if needed
- [ ] Create Telegram payment/order flow
- [ ] Track member Glow Number entries
- [ ] Track Glow Ball add-ons
- [ ] Enforce per-member purchase limits
- [ ] Stop entries automatically at cutoff time
- [ ] Post result link inside Telegram
- [ ] Add official result messages for each round

## Cloudflare Deployment

- [ ] Connect GitHub repo to Cloudflare Pages
- [ ] Select `glow23` repository
- [ ] Set framework preset to None
- [ ] Leave build command blank
- [ ] Set output directory to `/`
- [ ] Deploy project
- [ ] Confirm free Pages link works
- [ ] Test live interface on desktop
- [ ] Test live interface on mobile
- [ ] Test side menu
- [ ] Test search
- [ ] Test countdown
- [ ] Test cutoff status

## Current Phase

Glow 23 is currently in Phase 1 production.

The current version is a static front-end live interface starter.

The next major production step is deployment to Cloudflare Pages using the free Pages domain.
