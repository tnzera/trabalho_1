const restify = require("restify");
const errors = require("restify-errors");

const servidor = restify.createServer({
    name : 'loja' ,
    version : '1.0.0'
});

servidor.use( restify.plugins.acceptParser(servidor.acceptable) );
servidor.use( restify.plugins.queryParser());
servidor.use( restify.plugins.bodyParser());



servidor.listen( 8001 , function(){
    console.log("%s executando em %s", 
    servidor.name, servidor.url);
});

var knex = require('knex')({
    client : 'mysql' ,
    connection : {
        host : 'localhost' ,
        user : 'root' ,
        password : '' ,
        database : 'loja'
    }
});

servidor.get( '/' , (req, res, next) => {
    res.send('Bem-vindo(a) `a API Loja!');
});

servidor.get( '/produtos' , (req, res, next) => {
    knex('produtos').then( (dados) =>{
        res.send( dados );
    }, next) ; 
});

servidor.get( '/produtos/:idProd' , (req, res, next) => {
    const idProduto = req.params.idProd;
    knex('produtos')
        .where( 'id' , idProduto)
        .first()
        .then( (dados) =>{
            if( !dados || dados =="" ){
                return res.send(
                    new errors.BadRequestError('Produto não encontrado'));
            }
            res.send( dados );
        }, next) ; 
});

servidor.post( '/produtos' , (req, res, next) => {
    knex('produtos')
        .insert( req.body )
        .then( (dados) =>{
            res.send( dados );
        }, next) ; 
});


servidor.post('/pedidos', (req, res, next) => {
    
    const { horario, endereco, cliente_id, produtos } = req.body;

    
    if (!horario || !endereco || !cliente_id || !produtos) {
        return res.send(new errors.BadRequestError('Campos obrigatórios faltando.'));
    }

   
    knex('pedidos')
        .insert({ horario, endereco, cliente_id })
        .then((orderIds) => {
            const orderId = orderIds[0];

            
            const pedidoProdutos = produtos.map((produto) => {
                return {
                    pedido_id: orderId,
                    produto_id: produto.produto_id,
                    preco: produto.preco,
                    quantidade: produto.quantidade
                };
            });

            knex('pedidos_produtos')
                .insert(pedidoProdutos)
                .then(() => {
                    res.send({ message: 'Pedido criado com sucesso', pedido_id: orderId });
                })
                .catch(next);
        })
        .catch(next);
});


servidor.get('/pedidos/:pedido_id', (req, res, next) => {
    const pedido_id = req.params.pedido_id;

    knex('pedidos')
        .where('id', pedido_id)
        .first()
        .then((order) => {
            if (!order) {
                return res.send(new errors.BadRequestError('Pedido não encontrado'));
            }

            
            knex('pedidos_produtos')
                .where('pedido_id', pedido_id)
                .then((orderProducts) => {
                    order.produtos = orderProducts;
                    res.send(order);
                })
                .catch(next);
        })
        .catch(next);
});


servidor.put( '/produtos/:idProd' , (req, res, next) => {
    const idProduto = req.params.idProd;
    knex('produtos')
        .where( 'id' , idProduto)
        .update( req.body )
        .then( (dados) =>{
            if( !dados ){
                return res.send(
                    new errors.BadRequestError('Produto não encontrado'));
            }
            res.send( "Produto Atualizado" );
        }, next) ; 
});

servidor.del( '/produtos/:idProd' , (req, res, next) => {
    const idProduto = req.params.idProd;
    knex('produtos')
        .where( 'id' , idProduto)
        .delete()
        .then( (dados) =>{
            if( !dados ){
                return res.send(
                    new errors.BadRequestError('Produto não encontrado'));
            }
            res.send( "Produto Deletado" );
        }, next) ; 
});