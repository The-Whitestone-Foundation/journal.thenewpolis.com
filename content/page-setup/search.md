---
title: Search
description: Search Articles, Issues, and Editorial content.
permalink: /search/
layout: layouts/base.njk
---
<main class="container my-5">
    <header class="mb-5 pb-3 border-bottom">
        <h1 class="display-5 serif fw-bold">{{ title }}</h1>
        <p class="lead text-secondary">{{ description }}</p>
    </header>

    <div id="search" class="serif">
        <pagefind-input autofocus placeholder="Type keywords (e.g. Agile, Ethics, Jurnal...)"></pagefind-input>
        <pagefind-summary></pagefind-summary>
        <pagefind-results show-images></pagefind-results>
    </div>
</main>

<style>
    #search {
        --pf-font: 'Georgia', serif;
        --pf-border-radius: 0;
        --pf-results-gap: 1.5rem;
        --pf-result-title-font-size: 1.25rem;
        --pf-result-excerpt-font-size: 1rem;
    }
    #search pagefind-summary {
        display: block;
        margin: 1rem 0;
    }
</style>
