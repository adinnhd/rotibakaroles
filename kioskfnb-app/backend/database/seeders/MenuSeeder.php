<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\MenuCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Paket', 'slug' => 'paket', 'icon' => '🎁', 'sort_order' => 1],
            ['name' => 'Burger', 'slug' => 'burger', 'icon' => '🍔', 'sort_order' => 2],
            [
                'name' => 'Ayam', 'slug' => 'ayam', 'icon' => '🍗', 'sort_order' => 3,
                'options' => [
                    [
                        'id' => 'part',
                        'label' => 'Bagian Ayam',
                        'choices' => [
                            ['id' => 'paha-atas', 'label' => 'Paha Atas'],
                            ['id' => 'sayap', 'label' => 'Sayap'],
                            ['id' => 'dada', 'label' => 'Dada'],
                            ['id' => 'paha-bawah', 'label' => 'Paha Bawah'],
                        ],
                    ]
                ]
            ],
            ['name' => 'Sides', 'slug' => 'sides', 'icon' => '🍟', 'sort_order' => 4],
            [
                'name' => 'Minuman', 'slug' => 'minuman', 'icon' => '🥤', 'sort_order' => 5,
                'options' => [
                    [
                        'id' => 'size',
                        'label' => 'Ukuran',
                        'choices' => [
                            ['id' => 'regular', 'label' => 'Regular', 'priceDelta' => 0],
                            ['id' => 'large', 'label' => 'Large', 'priceDelta' => 4000],
                        ],
                    ],
                    [
                        'id' => 'ice',
                        'label' => 'Es',
                        'choices' => [
                            ['id' => 'none', 'label' => 'None Ice', 'priceDelta' => 0],
                            ['id' => 'less', 'label' => 'Less Ice', 'priceDelta' => 0],
                            ['id' => 'regular', 'label' => 'Regular Ice', 'priceDelta' => 0],
                            ['id' => 'extra', 'label' => 'Extra Ice', 'priceDelta' => 0],
                        ],
                    ],
                ]
            ],
            ['name' => 'Dessert', 'slug' => 'dessert', 'icon' => '🍦', 'sort_order' => 6],
        ];

        foreach ($categories as $categoryData) {
            MenuCategory::updateOrCreate(
                ['slug' => $categoryData['slug']],
                [
                    'name' => $categoryData['name'],
                    'icon' => $categoryData['icon'],
                    'sort_order' => $categoryData['sort_order'],
                    'is_active' => true,
                    'options' => $categoryData['options'] ?? null,
                ]
            );
        }

        Menu::query()->delete();

        $base = '/uploads/menu-images/';

        $menus = [
            // PAKET
            ['category'=>'paket','sub_category'=>'Hemat','name'=>'Paket Hemat A','name_en'=>'Budget Meal A','description'=>'1 Burger + 1 Minuman','description_en'=>'1 Burger + 1 Drink','price'=>25000,'image_url'=>$base.'paket-hemat-a.png','is_recommended'=>true,'serving_min_people'=>1,'serving_max_people'=>1],
            ['category'=>'paket','sub_category'=>'Hemat','name'=>'Paket Hemat B','name_en'=>'Budget Meal B','description'=>'2 Burger + 2 Minuman','description_en'=>'2 Burgers + 2 Drinks','price'=>45000,'image_url'=>$base.'paket-hemat-b.png','is_recommended'=>true,'serving_min_people'=>2,'serving_max_people'=>2],
            ['category'=>'paket','sub_category'=>'Ramai','name'=>'Paket Trio','name_en'=>'Trio Meal','description'=>'3 Burger + 3 Minuman + Kentang','description_en'=>'3 Burgers + 3 Drinks + Fries','price'=>75000,'image_url'=>$base.'paket-trio.png','is_recommended'=>true,'serving_min_people'=>3,'serving_max_people'=>3],
            ['category'=>'paket','sub_category'=>'Ramai','name'=>'Paket Keluarga','name_en'=>'Family Meal','description'=>'4 Burger + 4 Minuman + 2 Kentang','description_en'=>'4 Burgers + 4 Drinks + 2 Fries','price'=>120000,'image_url'=>$base.'paket-keluarga.png','is_recommended'=>true,'serving_min_people'=>4,'serving_max_people'=>6],

            // BURGER
            ['category'=>'burger','sub_category'=>'Sapi','name'=>'Classic Burger','name_en'=>'Classic Burger','description'=>'Daging sapi dengan keju, selada, tomat, dan saus spesial','description_en'=>'Beef patty with cheese, lettuce, tomato, and special sauce','price'=>35000,'image_url'=>$base.'classic-burger.png'],
            ['category'=>'burger','sub_category'=>'Sapi','name'=>'Cheese Burger','name_en'=>'Cheese Burger','description'=>'Double keju dengan daging sapi premium','description_en'=>'Double cheese with premium beef patty','price'=>42000,'image_url'=>$base.'cheese-burger.png'],
            ['category'=>'burger','sub_category'=>'Sapi','name'=>'Beef Burger','name_en'=>'Beef Burger','description'=>'Daging sapi premium dengan saus BBQ','description_en'=>'Premium beef patty with BBQ sauce','price'=>48000,'image_url'=>$base.'beef-burger.png'],
            ['category'=>'burger','sub_category'=>'Sapi','name'=>'BBQ Burger','name_en'=>'BBQ Burger','description'=>'Daging sapi dengan saus BBQ, bacon crispy, bawang karamel','description_en'=>'Beef patty with BBQ sauce, crispy bacon, caramelized onion','price'=>52000,'image_url'=>$base.'bbq-burger.png'],
            ['category'=>'burger','sub_category'=>'Ayam','name'=>'Chicken Burger','name_en'=>'Chicken Burger','description'=>'Ayam crispy dengan mayo dan selada segar','description_en'=>'Crispy chicken with mayo and fresh lettuce','price'=>32000,'image_url'=>$base.'chicken-burger.png'],
            ['category'=>'burger','sub_category'=>'Ayam','name'=>'Spicy Burger','name_en'=>'Spicy Burger','description'=>'Ayam crispy pedas dengan saus hot dan jalapeno','description_en'=>'Spicy crispy chicken with hot sauce and jalapeno','price'=>35000,'image_url'=>$base.'spicy-burger.png'],
            ['category'=>'burger','sub_category'=>'Ikan','name'=>'Fish Burger','name_en'=>'Fish Burger','description'=>'Ikan fillet crispy dengan saus tartar dan selada','description_en'=>'Crispy fish fillet with tartar sauce and lettuce','price'=>30000,'image_url'=>$base.'fish-burger.png'],
            ['category'=>'burger','sub_category'=>'Vegetarian','name'=>'Veggie Burger','name_en'=>'Veggie Burger','description'=>'Patty nabati dengan sayuran segar','description_en'=>'Plant-based patty with fresh vegetables','price'=>38000,'image_url'=>$base.'veggie-burger.png'],

            // AYAM
            ['category'=>'ayam','sub_category'=>'Goreng','name'=>'Ayam Goreng Crispy','name_en'=>'Crispy Fried Chicken','description'=>'2 potong ayam goreng crispy dengan bumbu rahasia','description_en'=>'2 pcs crispy fried chicken with secret spices','price'=>28000,'image_url'=>$base.'ayam-goreng-crispy.png'],
            ['category'=>'ayam','sub_category'=>'Goreng','name'=>'Chicken Wings','name_en'=>'Chicken Wings','description'=>'6 potong sayap ayam crispy dengan saus pilihan','description_en'=>'6 pcs crispy chicken wings with choice of sauce','price'=>35000,'image_url'=>$base.'chicken-wings.png'],
            ['category'=>'ayam','sub_category'=>'Goreng','name'=>'Ayam Geprek','name_en'=>'Smashed Fried Chicken','description'=>'Ayam crispy geprek dengan sambal pedas','description_en'=>'Crispy chicken smashed with spicy chili sauce','price'=>30000,'image_url'=>$base.'ayam-geprek.png'],
            ['category'=>'ayam','sub_category'=>'Goreng','name'=>'Ayam Katsu','name_en'=>'Chicken Katsu','description'=>'Ayam katsu ala Jepang dengan saus tonkatsu','description_en'=>'Japanese chicken katsu with tonkatsu sauce','price'=>38000,'image_url'=>$base.'ayam-katsu.png'],
            ['category'=>'ayam','sub_category'=>'Goreng','name'=>'Popcorn Chicken','name_en'=>'Popcorn Chicken','description'=>'Gigitan ayam crispy dalam keranjang','description_en'=>'Crispy popcorn chicken bites in basket','price'=>25000,'image_url'=>$base.'popcorn-chicken.png'],
            ['category'=>'ayam','sub_category'=>'Bakar','name'=>'Ayam Bakar','name_en'=>'Grilled Chicken','description'=>'Ayam bakar dengan sambal dan lalapan','description_en'=>'Grilled chicken with chili sauce and fresh vegetables','price'=>32000,'image_url'=>$base.'ayam-bakar.png'],
            ['category'=>'ayam','sub_category'=>'Bakar','name'=>'Chicken Steak','name_en'=>'Chicken Steak','description'=>'Ayam panggang dengan kentang tumbuk','description_en'=>'Grilled chicken breast with mashed potato','price'=>42000,'image_url'=>$base.'chicken-steak.png'],
            ['category'=>'ayam','sub_category'=>'Bakar','name'=>'Ayam Saus Padang','name_en'=>'Padang Sauce Chicken','description'=>'Ayam goreng dengan saus Padang pedas','description_en'=>'Fried chicken with spicy Padang sauce','price'=>33000,'image_url'=>$base.'ayam-saus-padang.png'],

            // SIDES
            ['category'=>'sides','sub_category'=>'Kentang','name'=>'Kentang Goreng','name_en'=>'French Fries','description'=>'Kentang goreng crispy dengan saus','description_en'=>'Crispy fried potatoes with dipping sauce','price'=>15000,'image_url'=>$base.'kentang-goreng.png'],
            ['category'=>'sides','sub_category'=>'Gorengan','name'=>'Onion Rings','name_en'=>'Onion Rings','description'=>'Bawang goreng crispy dengan saus mayo','description_en'=>'Crispy battered onion rings with mayo sauce','price'=>18000,'image_url'=>$base.'onion-rings.png'],
            ['category'=>'sides','sub_category'=>'Gorengan','name'=>'Nugget Ayam','name_en'=>'Chicken Nuggets','description'=>'6 potong nugget ayam dengan saus','description_en'=>'6 pcs chicken nuggets with dipping sauce','price'=>20000,'image_url'=>$base.'nugget-ayam.png'],
            ['category'=>'sides','sub_category'=>'Gorengan','name'=>'Mozzarella Sticks','name_en'=>'Mozzarella Sticks','description'=>'Mozarella crispy dengan saus marinara','description_en'=>'Crispy mozzarella sticks with marinara sauce','price'=>22000,'image_url'=>$base.'mozzarella-sticks.png'],
            ['category'=>'sides','sub_category'=>'Salad','name'=>'Coleslaw','name_en'=>'Coleslaw','description'=>'Salad kubis dengan saus mayo','description_en'=>'Shredded cabbage salad with creamy mayo dressing','price'=>12000,'image_url'=>$base.'coleslaw.png'],
            ['category'=>'sides','sub_category'=>'Lainnya','name'=>'Corn Cup','name_en'=>'Corn Cup','description'=>'Jagung manis dengan mentega dan keju','description_en'=>'Sweet corn with butter and cheese','price'=>13000,'image_url'=>$base.'corn-cup.png'],
            ['category'=>'sides','sub_category'=>'Lainnya','name'=>'Mac and Cheese','name_en'=>'Mac and Cheese','description'=>'Makaroni dengan saus keju creamy','description_en'=>'Macaroni with creamy cheese sauce','price'=>20000,'image_url'=>$base.'mac-and-cheese.png'],

            // MINUMAN
            ['category'=>'minuman','sub_category'=>'Teh','name'=>'Es Teh Manis','name_en'=>'Iced Sweet Tea','description'=>'Teh manis dingin yang menyegarkan','description_en'=>'Refreshing cold sweet tea','price'=>8000,'image_url'=>$base.'es-teh-manis.png'],
            ['category'=>'minuman','sub_category'=>'Teh','name'=>'Lemon Tea','name_en'=>'Lemon Tea','description'=>'Teh dingin dengan irisan lemon segar','description_en'=>'Iced tea with fresh lemon slice','price'=>12000,'image_url'=>$base.'lemon-tea.png'],
            ['category'=>'minuman','sub_category'=>'Jus','name'=>'Es Jeruk','name_en'=>'Fresh Orange Juice','description'=>'Jus jeruk segar dengan es','description_en'=>'Fresh squeezed orange juice with ice','price'=>15000,'image_url'=>$base.'es-jeruk.png'],
            ['category'=>'minuman','sub_category'=>'Soda','name'=>'Cola','name_en'=>'Cola','description'=>'Minuman soda dingin','description_en'=>'Cold carbonated cola drink','price'=>12000,'image_url'=>$base.'cola.png'],
            ['category'=>'minuman','sub_category'=>'Soda','name'=>'Sprite','name_en'=>'Sprite','description'=>'Minuman soda lemon yang segar','description_en'=>'Refreshing lemon-lime soda','price'=>12000,'image_url'=>$base.'sprite.png'],
            ['category'=>'minuman','sub_category'=>'Soda','name'=>'Fanta','name_en'=>'Fanta','description'=>'Minuman soda rasa jeruk','description_en'=>'Orange flavored soda','price'=>12000,'image_url'=>$base.'fanta.png'],
            ['category'=>'minuman','sub_category'=>'Air','name'=>'Air Mineral','name_en'=>'Mineral Water','description'=>'Air mineral segar','description_en'=>'Still mineral water','price'=>5000,'image_url'=>$base.'air-mineral.png'],
            ['category'=>'minuman','sub_category'=>'Milkshake','name'=>'Milkshake Coklat','name_en'=>'Chocolate Milkshake','description'=>'Milkshake coklat dengan whipped cream','description_en'=>'Chocolate milkshake with whipped cream','price'=>25000,'image_url'=>$base.'milkshake-coklat.png'],
            ['category'=>'minuman','sub_category'=>'Milkshake','name'=>'Milkshake Vanilla','name_en'=>'Vanilla Milkshake','description'=>'Milkshake vanilla dengan whipped cream','description_en'=>'Vanilla milkshake with whipped cream','price'=>25000,'image_url'=>$base.'milkshake-vanilla.png'],
            ['category'=>'minuman','sub_category'=>'Kopi','name'=>'Es Kopi','name_en'=>'Iced Coffee','description'=>'Kopi susu dingin yang nikmat','description_en'=>'Iced coffee with milk','price'=>18000,'image_url'=>$base.'es-kopi.png'],

            // DESSERT
            ['category'=>'dessert','sub_category'=>'Es Krim','name'=>'Es Krim Sundae','name_en'=>'Ice Cream Sundae','description'=>'Es krim vanilla dengan topping cokelat','description_en'=>'Vanilla ice cream with chocolate topping','price'=>18000,'image_url'=>$base.'es-krim-sundae.png'],
            ['category'=>'dessert','sub_category'=>'Kue','name'=>'Brownies','name_en'=>'Chocolate Brownies','description'=>'Brownies cokelat hangat dengan es krim','description_en'=>'Warm chocolate brownies served with ice cream','price'=>22000,'image_url'=>$base.'brownies.png'],
            ['category'=>'dessert','sub_category'=>'Kue','name'=>'Cheesecake','name_en'=>'Cheesecake','description'=>'Cheesecake ala New York','description_en'=>'New York style cheesecake','price'=>25000,'image_url'=>$base.'cheesecake.png'],
            ['category'=>'dessert','sub_category'=>'Kue','name'=>'Pie Apel','name_en'=>'Apple Pie','description'=>'Pie apel hangat dengan es krim vanilla','description_en'=>'Warm apple pie served with vanilla ice cream','price'=>20000,'image_url'=>$base.'pie-apel.png'],
            ['category'=>'dessert','sub_category'=>'Kue','name'=>'Donat Coklat','name_en'=>'Chocolate Donut','description'=>'Donat dengan glazing coklat dan sprinkles','description_en'=>'Chocolate glazed donut with sprinkles','price'=>15000,'image_url'=>$base.'donat-coklat.png'],
            ['category'=>'dessert','sub_category'=>'Pudding','name'=>'Pudding Coklat','name_en'=>'Chocolate Pudding','description'=>'Pudding coklat dengan saus karamel','description_en'=>'Chocolate pudding with caramel sauce','price'=>15000,'image_url'=>$base.'pudding-coklat.png'],
            ['category'=>'dessert','sub_category'=>'Kue','name'=>'Waffle','name_en'=>'Waffle','description'=>'Waffle Belgian dengan madu, mentega, dan stroberi','description_en'=>'Belgian waffle with honey, butter, and strawberry','price'=>28000,'image_url'=>$base.'waffle.png'],
        ];

        foreach ($menus as $menuData) {
            $category = MenuCategory::where('slug', $menuData['category'])->firstOrFail();

            Menu::updateOrCreate(
                ['slug' => Str::slug($menuData['name'])],
                [
                    'menu_category_id' => $category->id,
                    'name' => $menuData['name'],
                    'name_en' => $menuData['name_en'] ?? null,
                    'description' => $menuData['description'],
                    'description_en' => $menuData['description_en'] ?? null,
                    'sub_category' => $menuData['sub_category'] ?? null,
                    'price' => $menuData['price'],
                    'image_url' => $menuData['image_url'],
                    'is_available' => true,
                    'is_recommended' => $menuData['is_recommended'] ?? false,
                    'serving_min_people' => $menuData['serving_min_people'] ?? 1,
                    'serving_max_people' => $menuData['serving_max_people'] ?? 1,
                ]
            );
        }
    }
}
