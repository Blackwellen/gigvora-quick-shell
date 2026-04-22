import { Injectable } from '@nestjs/common';

@Injectable()
export class BooleanParserService {
  parse(query: string) {
    const spaced = query.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ');
    const raw = spaced.split(/\s+/).map((part) => part.trim()).filter(Boolean);
    const must: any[] = [];
    const should: any[] = [];
    const mustNot: any[] = [];
    let target = must;

    for (const token of raw) {
      const upper = token.toUpperCase();
      if (upper === 'OR') {
        target = should;
        continue;
      }
      if (upper === 'NOT') {
        target = mustNot;
        continue;
      }
      if (upper === 'AND' || token === '(' || token === ')') {
        target = must;
        continue;
      }
      const cleaned = token.replace(/^"|"$/g, '');
      if (!cleaned) continue;
      target.push({ multi_match: { query: cleaned, fields: ['title^3', 'tags^2', 'body'] } });
      if (target !== should) target = must;
    }

    return { bool: { must, should, must_not: mustNot } };
  }
}