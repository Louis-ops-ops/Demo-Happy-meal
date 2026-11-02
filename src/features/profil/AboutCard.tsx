import { Card } from '../../components/Card'

/** Sources and licences. The Ciqual citation is required by its Etalab 2.0 licence. */
export function AboutCard() {
  return (
    <Card className="flex flex-col gap-03">
      <h2 className="text-title-3 text-text">À propos</h2>
      <p className="text-body-sm text-text-muted">
        Les valeurs nutritionnelles viennent de la table Ciqual 2025 de l’Anses (Licence Ouverte Etalab 2.0,
        doi : 10.57745/RDMHWY). Les recettes sont originales, sous licence CC0. Le code est sous licence MIT.
      </p>
      <p className="text-body-sm text-text-muted">
        Les calculs sont des estimations indicatives et ne remplacent pas un avis médical. Gluten, lactose et porc sont
        repérés d’après le nom des aliments : en cas d’allergie, vérifie toujours les étiquettes.
      </p>
      <p className="text-body-sm text-text-muted">Tes données restent sur cet appareil. Aucun compte, aucun serveur.</p>
    </Card>
  )
}
