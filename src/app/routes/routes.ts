import { Router } from "express";
import ColecaoController from "../controllers/ColecaoController";
import CitacaoController from "../controllers/CitacaoController";

const routers = Router()

// Usado pelo Docker e pelos testes de carga para saber se a API já está de pé.
routers.get('/health', (_request, response) => {
  response.json({ status: 'ok' })
})

routers.use(ColecaoController.routes)
routers.use(CitacaoController.routes)

export default routers