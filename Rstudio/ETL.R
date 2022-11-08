componente = Utilizacao_Cpu

#componente$dataColeta <- substr(componente$dataColeta, 1, 10)
# Pega os dados daquele Dia
componente_filtered <- subset(componente, grepl("2022-11-07", componente$dataColeta, fixed=TRUE))

dados <- c(componente_filtered$valorLeitura)
variacaoDados <- (dados - mean(dados)) ^ 2
sum(variacaoDados)/ (length(variacaoDados))
variancia <- mean(variacaoDados)
variancia
sqrt(variacaoDados)
mean(dados)
var(dados)
plot(dados)
