export enum RestaurantType {
  PIZZERIA = 'pizzeria',
  FAST_FOOD = 'fast_food',
  ASIATIQUE = 'asiatique',
  BOULANGERIE = 'boulangerie',
  CAFE = 'cafe',
  PATISSERIE = 'patisserie',
  GRILL = 'grill',
  HEALTHY = 'healthy',
  FOOD_TRUCK = 'food_truck',
  TRADITIONNEL = 'traditionnel',
  BAR = 'bar',
  TRAITEUR = 'traiteur',
}

export const RESTAURANT_TYPE_LABELS: Record<RestaurantType, string> = {
  [RestaurantType.PIZZERIA]: '🍕 Pizzeria / Italien',
  [RestaurantType.FAST_FOOD]: '🍔 Fast-Food / Burger',
  [RestaurantType.ASIATIQUE]: '🍜 Asiatique (Sushi, Wok, etc.)',
  [RestaurantType.BOULANGERIE]: '🥖 Boulangerie / Viennoiserie',
  [RestaurantType.CAFE]: '☕ Café / Salon de thé',
  [RestaurantType.PATISSERIE]: '🍰 Pâtisserie / Glacier',
  [RestaurantType.GRILL]: '🍖 Grill / Steakhouse',
  [RestaurantType.HEALTHY]: '🥗 Healthy / Végétarien',
  [RestaurantType.FOOD_TRUCK]: '🚚 Food Truck / Nomade',
  [RestaurantType.TRADITIONNEL]: '🍽️ Restaurant Traditionnel',
  [RestaurantType.BAR]: '🍷 Bar / Brasserie',
  [RestaurantType.TRAITEUR]: '🎂 Traiteur / Événementiel',
};
