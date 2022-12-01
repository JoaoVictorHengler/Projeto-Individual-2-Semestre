SELECT Distinct fkMetrica, DATE(dataColeta), HOUR(dataColeta), MINUTE(dataColeta), 
	(SELECT valorLeitura from `vw_sptech_servidor-sptech` as V2 
    where DATE(V1.dataColeta) = DATE(V2.dataColeta) and
    HOUR(V1.dataColeta) = HOUR(V2.dataColeta) and
    MINUTE(V1.dataColeta) = MINUTE(V2.dataColeta) order by dataColeta desc limit 1)
 from `vw_sptech_servidor-sptech` AS V1 order by fkMetrica;
 SELECT Distinct fkMetrica, DATE(dataColeta), HOUR(dataColeta), MINUTE(dataColeta), SECOND(dataColeta), valorLeitura
 from `vw_sptech_servidor-sptech` AS V1 where valorLeitura != -500.00 order by fkMetrica;
 