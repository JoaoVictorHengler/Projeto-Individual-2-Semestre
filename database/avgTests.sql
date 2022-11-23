use pardalis;
select * from leitura;
-- Horas divididas
select Distinct DATE(dataColeta), HOUR(dataColeta) from leitura AS L1 WHERE L1.fkMaquina = 2 AND L1.fkEmpresa = 1 order by dataColeta limit 24;	

(SELECT fkMetrica, dataColeta, valorLeitura FROM Leitura AS L2
		where L2.fkMaquina = 2 and L2.fkEmpresa = 1
		and HOUR(L2.dataColeta) = 0 AND DATE(L2.dataColeta) = '2022-11-06' order by fkMetrica);


-- Informações de um único minuto De qualquer métrica, se quiser limitar: 
(SELECT dataColeta, valorLeitura FROM Leitura AS L2
		where L2.fkMaquina = 2 and L2.fkEmpresa = 1 and L2.fkComponente = 1 AND L2.fkMetrica = 1 
		and HOUR(L2.dataColeta) = 11 AND MINUTE(L2.dataColeta) = 25 AND DATE(L2.dataColeta) = '2022-10-28' LIMIT 60)

from leitura where fkMaquina = 2 and fkEmpresa = 1 and fkComponente = 1 and fkMetrica = 1 
and HOUR(dataColeta) = 11 AND DATE(dataColeta) = '2022-10-28';

-- Funcionando para 1 dia, porém se tiver muitos dados da erro
select Distinct DATE(dataColeta) AS 'dateCollect', HOUR(dataColeta) as 'hourCollect',
	(SELECT avg(valorLeitura) FROM Leitura AS L2
		where L2.fkMaquina = 2 and L2.fkEmpresa = 1 and L2.fkMetrica = 1 and L2.fkComponente = 1
        AND HOUR(L2.dataColeta) = HOUR(L1.dataColeta) AND DATE(L2.dataColeta) = DATE(L1.dataColeta) LIMIT 60
        )
 from leitura AS L1 WHERE L1.fkMaquina = 2 AND L1.fkEmpresa = 1 AND 
		L1.fkMetrica = 1 AND L1.fkComponente = 1 AND DATE(L1.dataColeta) = '2022-11-06' limit 2;

select DISTINCT DATE(dataColeta), HOUR(dataColeta), MINUTE(dataColeta)
from leitura AS L1 WHERE L1.fkMaquina = 2 AND L1.fkEmpresa = 1 AND 
		L1.fkMetrica = 1 AND L1.fkComponente = 1 order by dataColeta;