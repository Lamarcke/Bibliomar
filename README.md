# Bibliomar
Um projeto educacional para download de livros, textos e artigos usando o LibraryGenesis como base.


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

