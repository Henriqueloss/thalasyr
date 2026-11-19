# Atlas — site do mapa

O site abre o mapa feito no **Cartógrafo** (o arquivo `.json`) e desenha a cidade aqui mesmo, sem mudar nada no arquivo. Em cima do mapa ficam só os **círculos numerados** que você coloca. Cada círculo abre a página do lugar, com quatro abas:

1. **Arte**: as imagens do lugar.
2. **História e elenco**: uma breve história, mais os retratos e as artes dos personagens do lugar.
3. **Mapa**: as imagens do mapa do lugar (battlemap, andares, porão…), uma embaixo da outra; um clique abre em tela cheia.
4. **Cardápio / Catálogo** (ou outro nome que você der): as páginas em imagem e/ou uma tabela de itens com preço.

A **legenda** se forma sozinha com os números que estão no mapa, agrupada pelos **tipos** de lugar que você cria (nome, cor e ícone). Nela, os botões de cada tipo mostram ou escondem os círculos daquele tipo no mapa (duplo clique mostra só ele).

O botão **Áreas** liga e desliga uma camada por cima do mapa com as **áreas dos distritos**: contornos coloridos com nome, descrição, informações (população, governante…) e notas do mestre. Clique numa área para ler as notas.

Mudanças no próprio mapa (ruas, prédios, nomes) continuam sendo feitas no Cartógrafo: os círculos e as áreas só ficam por cima.

## O que tem na pasta

| Arquivo | O que é |
|---|---|
| `index.html` | O site (já traz o desenhista do Cartógrafo, para abrir qualquer `.json`). |
| `site.js`, `site.css` | O funcionamento e o visual do site. |
| `data/mapa.json` | O mapa atual do Cartógrafo, sem o que é secreto e sem as notas e descrições do mestre (o completo fica com você). |
| `data/mapa.svg`, `data/mapa.jpg` | O mapa já desenhado (abre na hora; o `.jpg` é a visão de longe). |
| `data/distritos.json` | A população de cada distrito do mapa (usada ao criar as áreas a partir dos distritos). |
| `data/lugares.json` | Os tipos, os lugares (números, nomes, textos e as imagens que eles usam) e as áreas. Começa vazio. |
| `data/imagens/` | As imagens dos lugares (aparece quando você exportar o pacote). |
| `vendor/leaflet/` | Biblioteca de mapas (Leaflet 1.9.4, licença BSD-2). |

## Modo mestre

No botão **?** clique em *Entrar no modo mestre* (ou abra o endereço com `?mestre` no fim, por exemplo `https://SEU-USUARIO.github.io/atlas/?mestre`). O modo mestre vale só no navegador onde você entrou: o que você faz ali não muda o site publicado até você exportar e publicar. *Sair do modo mestre* fica no mesmo botão.

1. **Mapa:** *Abrir mapa* › escolha o `.json` do Cartógrafo. Ele é desenhado em alguns segundos e fica guardado neste navegador. *Voltar ao mapa publicado* desfaz isso.
2. **Lugares:** no painel *Lugares*, use *+ Novo lugar*: número, nome e tipo. O tipo é seu: escreva o nome (por exemplo *Taverna* ou *Loja de magia*), escolha a cor e, se quiser, um ícone. Ele vira sugestão para os próximos lugares; o último tipo usado já vem escolhido. Arraste o círculo até o mapa, ou clique no círculo e depois no mapa. No mapa, arraste o círculo para mover; no índice, ✕ tira do mapa (o lugar continua no índice).
   - **Tipos** (no painel *Lugares* ou em *editar tipos*, na legenda): renomeie, troque a cor e o ícone, mude a ordem, dê o nome da 4ª aba (Cardápio, Catálogo, Serviços…) ou apague um tipo (os lugares dele passam para outro tipo ou ficam sem tipo).
3. **Página do lugar:** clique no nome (no índice, na legenda ou no círculo) e preencha as abas. As imagens entram pelo botão de cada aba. *Secreto* deixa o lugar só no modo mestre.
   - Na aba *História e elenco*, além dos personagens (retrato, nome, papel e artes), *+ Imagens do elenco* recebe páginas inteiras com os personagens. Cada imagem pode ter legenda e a opção *Só para o mestre*, para páginas com segredos: ela some para os jogadores e não vai para o pacote publicado.
   - Na aba *Mapa*, *+ Imagens do mapa* recebe uma ou mais imagens (battlemap, andares…), também com legenda, ordem e *Só para o mestre* (por exemplo, para a versão com as portas secretas). As notas do mestre do mapa também não vão para o pacote publicado.
4. **Áreas:** com a camada *Áreas* ligada aparecem os botões *+ Desenhar área* (clique nos cantos; clique no primeiro ponto, dê duplo clique ou *Concluir* para fechar; Backspace desfaz o último ponto) e *Criar a partir dos distritos* (usa o contorno dos distritos do `.json`; as notas do distrito no Cartógrafo vão para as notas do mestre e a população para as informações). No cartão da área: nome, cor, descrição e informações (para todos), notas do mestre, *Secreta* e *Editar o contorno* (arraste os pontos; arraste os pontos do meio para criar outros; duplo clique apaga).
5. **Salvar:** tudo fica salvo automaticamente **neste navegador**. Para não perder nada e para publicar, use *Exportar*.

## Publicar (GitHub Pages)

1. No modo mestre, clique em **Exportar** › *Baixar o pacote*. Vem um `.zip` com a pasta `data` (lugares, imagens e, se marcado, o mapa). Deixe marcado *Imagens mais leves para a web*: as imagens vão em WebP, umas 10 vezes menores e sem diferença visível (as originais continuam no navegador).
2. **Descompacte o `.zip`.** O GitHub não descompacta nada, e pelo navegador ele só aceita arquivos de até 25 MB e até 100 arquivos por envio.
3. No repositório, *Add file › Upload files*:
   - primeiro envio: os arquivos do site (`index.html`, `site.js`, `site.css`, `README.md` e a pasta `vendor`), se ainda não estiverem lá ou se o site foi atualizado;
   - segundo envio: arraste a **pasta** `data` (não o `.zip`). Arquivos com o mesmo nome são substituídos.
4. Em Settings › Pages, publique a branch `main`, pasta `/ (root)`. Depois de cada envio o site atualiza em um ou dois minutos.

Se a pasta `data` passar de 100 arquivos, envie em partes: entre na pasta `data/imagens` do repositório e envie as imagens ali, em lotes de até 100.

O pacote para publicar não leva os lugares e as áreas secretos, as notas do mestre, as imagens só para o mestre nem o que é secreto ou anotação no mapa do Cartógrafo (prédios e túneis secretos, notas dos distritos, descrições). Tudo isso só vai na **cópia do mestre** (marque a opção ao exportar; ela vai com as imagens originais e é só para você: guarde, não publique).

Para continuar em outro computador, use **Importar** e escolha o pacote `.zip` exportado.

## No celular

O site funciona no celular: aproxime e afaste com dois dedos e toque nos círculos e nas áreas. A legenda e os cartões das áreas sobem de baixo da tela, e a página do lugar ocupa a tela toda. Para economizar dados, o site dos jogadores baixa primeiro só a imagem do mapa (`mapa.jpg`); o desenho detalhado (`mapa.svg`) só vem quando a pessoa aproxima. No modo mestre, para pôr um lugar no mapa, toque no círculo do índice e depois no mapa (arrastar o círculo só funciona com mouse).

## Observações

- Aberto direto do computador (duplo clique no `index.html`), o site mostra o mapa publicado em `data/`; algumas coisas (ler `lugares.json`) só funcionam no site publicado. No modo mestre, prefira o site publicado ou um servidor local.
- As imagens dos livros e os textos são seus para colocar: o site vem sem conteúdo de nenhum livro.
