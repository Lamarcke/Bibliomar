# Bibliomar
Um projeto educacional para download de livros, textos e artigos usando o LibraryGenesis como base.
# Atualização a caminho
Algumas coisas não estão 100% no Bibliomar, e esses errors 500 significam que eu teria de reescrever o aplicativo todo de outra forma, e é isso que vou fazer:
Bibliomar está sendo reescrito em React, usando o Biblioterra (uma API feita com FastAPI) como backend.


Link para visualizar:\
http://www.bibliomar.site

Toda contribuição é bem-vinda.\
Seja na forma de pull requests, ou na forma
de compartilhamentos.\
Esse projeto não tem e nunca tera valor monetário, a unica forma de manter ele vivo, é manter ele sendo usado.

Esse projeto só é possível graças ao grab-convert-from-libgen, do willmeyers:
https://github.com/willmeyers/grab-convert-from-libgen

## O que o Bibliomar pode fazer?
Atualmente, o usuario pode pesquisar por qualquer tipo de texto, em qualquer categoria disponibilizada pelo LibraryGenesis.\
O usuario pode pesquisar por livros em diversos formatos, mesmo os não disponíveis nas opções de filtro do Bibliomar (usando a opção "TODOS").\

### Caracteristicas
O Bibliomar tem atualmente um sistema de cache bem básico, usando apenas a WebStorage API.\
Uma implementação no back-end é estudada, mas parece impossível devido às limitações de rede e nos provedores de banco de dados.
Não vale a pena salvar o link para capa de 10.000 livros sendo que o LibraryGenesis tem provavelmente mais de 100 vezes isso.

### Uso de recursos
Feito com um servidor pequeno em mente, a maior parte do uso do projeto se trata de uso de rede. Este é limitado pela maioria 
dos servidores em seus planos gratuitos.\

As funções em `/search/metadatahandler.py` são as que mais consomem rede, seguido da função de pesquisa em sí.
A unica função com "alto" ("alto" de "o maior") uso de CPU é a função de filtro dos resultados de não-ficcção, implementada por conta
própria.

Para ajudar na questão do uso de rede e CPU, algumas limitações foram impostas no design: Infelizmente, se uma pesquisa 
de não-ficção retornar mais de 100 resultados no Libgen, a maior parte deles será descartada na filtragem, e se a filtragem não encontrar
nenhum resultado nesses primeiros 100 resultados, então a pesquisa aparece como vazia.\
Isso só é um problema durante as pesquisas de Autor, que normalmente são mais abrangentes. A pesquisa por autor foi desabilitada
por este motivo.

Com essas informações, pode-se dizer que o Bibliomar é um aplicativo rápido. 

### Prova de conceito
Esse site, aplicativo, e quase-API foi feito por um inicante, atualmente no 3o período de ADS.
Muita coisa foi feita a mão. Apesar do uso do framework MDBootstrap (criado com base no Bootstrap 5), a maior parte da interação é feita de forma própria, e muitas vezes não da melhor forma. O melhor exemplo é a função de paginação. Funciona, guarda o cache da pesquisa, mas eu não gosto de ter de reinventar roda.
Por exemplo, leia as funções `paginationHandler` e em seguida `resultsHandler`. Note como o código seria simplificado utilizando-se um simples método forEach().

Apesar disso, esse é um projeto que tenho orgulho, e também é um marco: é um projeto que eu mesmo projetei, estudei, completei e agora está ao ar para quem tiver interesse.
