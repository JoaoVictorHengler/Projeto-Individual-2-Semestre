Frequencia_Atual$dataColeta <- substr(Frequencia_Atual$dataColeta, 1, 10)
frequencia_atual_filtered <- subset(Frequencia_Atual, Frequencia_Atual$dataColeta == "2022-11-03")
dados <- c(frequencia_atual_filtered$valorLeitura)
variacaoDados <- (dados - mean(dados)) ^ 2
sum(variacaoDados)/ (length(variacaoDados))
variancia <- mean(variacaoDados)
variancia
mean(dados)
var(dados)
