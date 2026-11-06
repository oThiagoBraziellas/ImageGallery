# ImageGallery

Galeria de imagens responsiva com filtro por categoria e busca, carregamento preguiçoso (lazy loading) com `IntersectionObserver` e um lightbox navegável pelo teclado. As 60 imagens são ilustrações SVG geradas localmente, então tudo funciona offline e sem arquivos de imagem no repositório.

## Por que este projeto

Galerias, feeds e catálogos são telas comuns em produtos reais, e carregar mídia só quando necessário é um dos ganhos de desempenho mais simples e mais cobrados em entrevistas de front-end. O projeto reúne:

- uso correto de `IntersectionObserver`, com fallback quando a API não existe;
- um lightbox acessível (`role="dialog"`, `aria-modal`, armadilha de foco, `Esc`, setas, `Home`/`End`, retorno do foco ao elemento que abriu);
- estado do lightbox modelado como máquina de estados pura, testável sem DOM;
- CSS Grid responsivo sem bibliotecas.

## Recursos

- Grade responsiva (`auto-fill` + `minmax`) com itens altos ocupando duas linhas.
- Lazy loading: o SVG de cada imagem só é gerado e atribuído ao `src` quando o item chega perto da viewport (`rootMargin` de 200 px). Há um efeito de carregamento (shimmer) até a imagem aparecer.
- Filtro por categoria com contagem e busca por título, ignorando acentos e maiúsculas.
- Lightbox com setas ←/→, `Home`/`End`, `Esc`, botões na tela, gesto de deslizar no celular e pré-carregamento das imagens vizinhas.
- Navegação circular (da última volta à primeira).
- Respeita `prefers-reduced-motion`.

## Como executar

Abra o `index.html` no navegador ou use um servidor local:

```bash
python3 -m http.server 8000
# acesse http://localhost:8000
```

Não precisa de internet. Se o navegador bloquear ES modules em `file://`, use o servidor local.

## Como testar

Dentro desta pasta, com Node 18 ou superior:

```bash
node --test
```

Os testes cobrem o gerador de imagens (determinismo, SVG bem formado em todas as categorias), o filtro, o reducer do lightbox (limites, navegação circular, estado fechado), o mapeamento de teclas e gestos e o carregador preguiçoso com um `IntersectionObserver` falso.

## Decisões de projeto

- **Imagens geradas com semente.** Um gerador pseudoaleatório (mulberry32) torna cada imagem reproduzível a partir de `seed` e categoria. Os metadados (`spec`) são baratos; o SVG só é montado quando preciso, o que torna o lazy loading real e não apenas cosmético.
- **Data URI com `encodeURIComponent`.** Evita base64 (que incha o texto em cerca de 33%) e mantém o SVG legível durante a depuração.
- **Reducer puro para o lightbox.** Toda a navegação é `(estado, ação) => estado`, o que facilita testar casos de borda como lista vazia e índice fora do intervalo. O DOM apenas reflete o estado.
- **Filtro recria a grade.** Com 60 itens é mais simples e seguro descartar e recriar os elementos; com milhares, valeria virtualizar (veja o projeto *VirtualList*).
- **Complexidade.** Filtrar é O(n) por tecla (com debounce de 120 ms); navegar no lightbox é O(1); cada imagem é gerada no máximo uma vez, graças ao cache por id.
- **Foco.** O lightbox prende o foco enquanto está aberto e o devolve ao botão que o abriu ao fechar.

## Estrutura de pastas

```
ImageGallery/
├── index.html
├── style.css
├── src/
│   ├── app.js        # DOM, eventos e foco
│   ├── images.js     # gerador de SVG com semente
│   ├── filter.js     # filtro e contagem por categoria
│   ├── lightbox.js   # reducer, teclas, gestos e vizinhos
│   └── lazy.js       # wrapper do IntersectionObserver
├── tests/
├── package.json
├── LICENSE
└── README.md
```

## Limitações conhecidas

- As imagens são abstratas e sintéticas; não há upload nem imagens reais.
- Sem zoom por pinça nem arrastar para mover dentro do lightbox.
- A grade não é virtualizada: todos os itens filtrados existem no DOM (apenas as imagens são preguiçosas).
- O deslize no celular só foi pensado para toque simples, sem animação de transição entre imagens.

## Licença

MIT. Veja o arquivo [LICENSE](LICENSE).
