use pardalis;
SELECT * FROM `vw_sptech_servidor-sptech`;

CREATE OR REPLACE VIEW `vw_Sptech_Servidor-SPTECH` AS SELECT Distinct fkMetrica, date_format(dataColeta, '%Y-%m-%d') as 'diaInteiro', 
    HOUR(dataColeta) as 'hora', MINUTE(dataColeta) as 'minuto', SECOND(dataColeta) as 'segundo',
    valorLeitura FROM Leitura JOIN Metrica on idMetrica = fkMetrica and isEstatico = 0 WHERE fkEmpresa = 1 and fkMaquina = 1
    and valorLeitura != -500.00 and
    dataColeta > (
		SELECT dataColeta from Leitura where  fkMaquina = 1 & fkEmpresa = 1 order by dataColeta desc limit 1
    ) - interval 5 day;

 