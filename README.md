# Meu dinheiro

PWA de finanças pessoais em português, otimizada para celular.

**Abrir:** https://notas-maraba.github.io/meu-dinheiro-pwa/

## Instalar

- Android: abra no Chrome, menu → Instalar aplicativo.
- iPhone: abra no Safari, Compartilhar → Adicionar à Tela de Início.

## Recursos

Receitas e despesas, contas recorrentes, parcelas, categorias, vencimentos, pagamento por mês, busca e filtros. Dashboard com saldo previsto e realizado. Planejamento por recebimentos dos dias 1 e 20. Metas, reservas, IPVA/licenciamento, dívidas e orçamento de viagem. Backup JSON e CSV mensal. Modo offline após o primeiro acesso.

## Dados e premissas

Os dados ficam no localStorage deste navegador e aparelho, sem sincronização. Faça backups nos Ajustes; limpar dados do navegador remove os registros. Importar substitui os registros após confirmação.

O aplicativo público começa sem receitas e despesas. Cadastre seus valores ou importe um backup privado. O planejamento suporta recebimentos nos dias 1 e 20. IPVA/licenciamento tem início em maio e prazo em setembro, com valor editável.

Aportes planejados reduzem o saldo previsto. Registrar aporte atualiza o valor guardado sem descontar uma segunda vez. Dívidas e orçamento de viagem são acompanhamentos separados; lance as despesas em Contas para incluí-las no orçamento mensal.

Lembretes são verificados ao abrir o app. Com permissão do navegador, podem exibir notificações. **Não há alertas automáticos com o app fechado.** No iPhone, notificações podem exigir a instalação da PWA.

## Executar localmente

Sem dependências de instalação. Nesta pasta:

```sh
python -m http.server 8080 --bind 127.0.0.1
```

Abra http://localhost:8080. A instalação e o service worker precisam de HTTPS ou localhost; abrir o HTML diretamente não ativa a PWA.

## Publicação

GitHub Pages: branch `main`, pasta `/ (root)`. Todos os caminhos são relativos e funcionam no subdiretório do projeto. Incremente a versão do cache em `sw.js` ao publicar alterações.

O site e o código são públicos. Nenhum orçamento pessoal é incluído no código público. Os registros feitos ou importados no app ficam apenas no navegador e não são enviados ao GitHub.
