# Frequência PEAD (PWA)

Gera automaticamente a folha "Controle de Frequência do Beneficiário" do PEAD
para o mês atual (ou qualquer mês/intervalo de meses), pronta para imprimir ou salvar em PDF.

- Sábados e domingos são preenchidos automaticamente.
- Feriados nacionais fixos e Sexta-feira Santa já vêm incluídos.
- Feriados municipais/estaduais e pontos facultativos: basta informar a data.
- Funciona offline e pode ser instalado no celular/computador.

## Publicar no GitHub

1. Crie um repositório e envie todos estes arquivos para a branch `main`
   (o `index.html` precisa ficar na raiz).
2. Em **Settings → Pages → Build and deployment → Source**, escolha **GitHub Actions**.
3. Aguarde o workflow "Publicar no GitHub Pages" terminar (aba **Actions**).
   O endereço será `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

## Feriados e pontos facultativos

- **No app:** painel "Feriados e pontos facultativos" → data (ou período), tipo, adicionar.
  Fica salvo no aparelho do usuário.
- **Para todos os usuários:** edite `holidays.json`. Formato:

```json
[
  { "data": "2026-10-30", "tipo": "Feriado" },
  { "data": "2026-12-24", "tipo": "Ponto Facultativo", "desc": "Véspera de Natal" },
  { "data": "2026-03-16", "tipo": "Feriado", "desc": "Aniversário da cidade", "anual": true },
  { "data": "2026-12-28", "fim": "2026-12-31", "tipo": "Ponto Facultativo" }
]
```

`tipo` aceita `Feriado` ou `Ponto Facultativo`; `fim` define um período;
`anual: true` repete todo ano (apenas para um dia).
O botão "Copiar lista para holidays.json" monta esse JSON para você.

## Locais de trabalho e nomes automáticos

Os campos "Nome completo" e "Local de trabalho" aceitam digitação livre e mostram sugestões.
Ao escolher um local com um único nome (ex.: NAAS Maresias), o nome é preenchido sozinho;
com vários nomes (ex.: CRAS Boiçucanga), eles aparecem como sugestão no campo Nome.
Para incluir novos locais/nomes, edite a constante `LOCAIS` no início do `app.js`.

## Cabeçalho e rodapé

São as imagens originais do modelo, em `assets/cabecalho.png` e `assets/rodape.png`.
Para trocar, substitua os arquivos mantendo os mesmos nomes.

## Atualizações

Ao mudar qualquer arquivo, altere o nome do cache em `sw.js` (`pead-frequencia-v4` → `v5`)
para forçar a atualização nos aparelhos já instalados.
