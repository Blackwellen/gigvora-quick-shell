from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix='/boolean-search', tags=['boolean-search'])
MODEL = 'boolean-search-deterministic'
VERSION = '1.0.0'


class ParseRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)


class ParseResponse(BaseModel):
    data: dict[str, Any]
    meta: dict[str, Any]


@dataclass
class Token:
    value: str
    kind: str


def tokenize(query: str) -> list[Token]:
    spaced = query.replace('(', ' ( ').replace(')', ' ) ')
    tokens: list[Token] = []
    for part in spaced.split():
        upper = part.upper()
        if upper in {'AND', 'OR', 'NOT'}:
            tokens.append(Token(value=upper, kind='op'))
        elif part == '(':
            tokens.append(Token(value=part, kind='lparen'))
        elif part == ')':
            tokens.append(Token(value=part, kind='rparen'))
        else:
            tokens.append(Token(value=part.strip('"'), kind='term'))
    return tokens


def to_simple_dsl(tokens: list[Token]) -> dict[str, Any]:
    must: list[Any] = []
    should: list[Any] = []
    must_not: list[Any] = []
    target = must
    last_op = 'AND'
    for token in tokens:
        if token.kind == 'op':
            last_op = token.value
            if last_op == 'OR':
                target = should
            elif last_op == 'NOT':
                target = must_not
            else:
                target = must
            continue
        if token.kind != 'term':
            continue
        clause = {'multi_match': {'query': token.value, 'fields': ['title^3', 'tags^2', 'body']}}
        target.append(clause)
        if last_op != 'OR':
            target = must
    return {'bool': {'must': must, 'should': should, 'must_not': must_not}}


@router.post('/parse', response_model=ParseResponse)
def parse_query(body: ParseRequest) -> ParseResponse:
    tokens = tokenize(body.query)
    return ParseResponse(
        data={
            'tokens': [{'value': t.value, 'kind': t.kind} for t in tokens],
            'dsl': to_simple_dsl(tokens),
        },
        meta={'model': MODEL, 'version': VERSION, 'latency_ms': 1},
    )