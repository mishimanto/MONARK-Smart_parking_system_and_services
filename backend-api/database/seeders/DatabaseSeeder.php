<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\Contact;
use App\Models\Parking;
use App\Models\Service;
use App\Models\ServiceCenter;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        // \App\Models\User::factory(10)->create();

        // \App\Models\User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);

        $this->call([
            AdminSeeder::class,
            AboutPageSeeder::class,
            ContactPageSeeder::class,
        ]);

        Contact::updateOrCreate(
            ['email' => 'support@monark.test'],
            [
                'address' => 'Chasara, Narayanganj, Dhaka',
                'phone' => '+8801900000000',
                'map_embed' => null,
            ]
        );

        $parkings = [
            ['name' => 'MONARK City Parking', 'description' => 'Secure covered parking near the city center.', 'total_slots' => 40, 'available_slots' => 24, 'price_per_hour' => 80, 'distance' => '1.2 km'],
            ['name' => 'Narayanganj Plaza Parking', 'description' => 'Convenient parking with CCTV and 24/7 support.', 'total_slots' => 55, 'available_slots' => 31, 'price_per_hour' => 70, 'distance' => '2.5 km'],
            ['name' => 'Riverside Parking Hub', 'description' => 'Open-air parking for cars and SUVs.', 'total_slots' => 35, 'available_slots' => 18, 'price_per_hour' => 60, 'distance' => '3.1 km'],
        ];

        foreach ($parkings as $parking) {
            Parking::updateOrCreate(['name' => $parking['name']], $parking);
        }

        $center = ServiceCenter::updateOrCreate(
            ['name' => 'MONARK Car Care Center'],
            [
                'address' => 'Chasara, Narayanganj, Dhaka',
                'phone' => '+8801900000000',
                'email' => 'care@monark.test',
                'latitude' => 23.6238,
                'longitude' => 90.5000,
                'opening_hours' => '9:00 AM - 9:00 PM',
                'is_active' => true,
            ]
        );

        $services = [
            ['name' => 'Premium Car Wash', 'type' => 'wash', 'description' => 'Exterior foam wash and hand dry.', 'price' => 500, 'duration' => '45 min'],
            ['name' => 'Interior Deep Clean', 'type' => 'cleaning', 'description' => 'Vacuum, dashboard polish, and seat cleaning.', 'price' => 800, 'duration' => '1 hr'],
            ['name' => 'Wax & Polish', 'type' => 'detailing', 'description' => 'Paint shine protection with professional polish.', 'price' => 1200, 'duration' => '1.5 hr'],
        ];

        foreach ($services as $service) {
            Service::updateOrCreate(
                ['name' => $service['name']],
                $service + [
                    'service_center_id' => $center->id,
                    'status' => 'active',
                    'is_active' => true,
                ]
            );
        }
    }
}
