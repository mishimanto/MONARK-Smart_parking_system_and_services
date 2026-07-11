<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class HugeDemoDataSeeder extends Seeder
{
    private const USER_COUNT = 350;
    private const PARKING_COUNT = 45;
    private const SERVICE_CENTER_COUNT = 22;
    private const SERVICE_COUNT = 110;
    private const BOOKING_COUNT = 1800;
    private const SERVICE_ORDER_COUNT = 1300;
    private const WALLET_TRANSACTION_COUNT = 1600;
    private const MESSAGE_COUNT = 450;

    public function run(): void
    {
        $now = now();
        $runKey = $now->format('YmdHis');

        DB::disableQueryLog();

        $this->seedAdminAndMechanic($now);
        $this->seedStaticContent($now);
        $this->seedPaymentMethods($now);

        $users = $this->seedUsers($runKey, $now);
        $parkings = $this->seedParkingsAndSlots($runKey, $now);
        $services = $this->seedServiceCentersAndServices($runKey, $now);

        $this->seedBookings($users, $parkings, $runKey, $now);
        $this->seedServiceOrders($users, $services, $runKey, $now);
        $this->seedWalletTransactions($users, $runKey, $now);
        $this->seedMessages($runKey, $now);

        $this->command?->info('Huge demo data seeded successfully.');
        $this->command?->table(
            ['Dataset', 'Inserted'],
            [
                ['Users', self::USER_COUNT],
                ['Parking lots', self::PARKING_COUNT],
                ['Parking slots', collect($parkings)->sum(fn ($parking) => count($parking['slot_ids']))],
                ['Parking bookings', self::BOOKING_COUNT],
                ['Service centers', self::SERVICE_CENTER_COUNT],
                ['Services', self::SERVICE_COUNT],
                ['Service orders', self::SERVICE_ORDER_COUNT],
                ['Wallet transactions', self::WALLET_TRANSACTION_COUNT],
                ['Messages', self::MESSAGE_COUNT],
            ]
        );
    }

    private function seedAdminAndMechanic(Carbon $now): void
    {
        User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'wallet_balance' => 0,
                'is_blocked' => false,
                'email_verified_at' => $now,
            ]
        );

        User::updateOrCreate(
            ['email' => 'mechanic@monark.test'],
            [
                'name' => 'MONARK Mechanic',
                'password' => Hash::make('mechanic123'),
                'role' => 'mechanic',
                'wallet_balance' => 0,
                'is_blocked' => false,
                'email_verified_at' => $now,
            ]
        );
    }

    private function seedStaticContent(Carbon $now): void
    {
        DB::table('contacts')->updateOrInsert(
            ['email' => 'support@monark.test'],
            [
                'address' => 'Chasara, Narayanganj, Dhaka',
                'phone' => '+8801900000000',
                'map_embed' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('contact_us')->updateOrInsert(
            ['email' => 'support@monark.test'],
            [
                'title' => 'Contact MONARK',
                'subtitle' => 'Parking and car care support across Narayanganj and Dhaka.',
                'address' => "Chasara, Narayanganj, Dhaka\nBangladesh",
                'phone' => '+8801900000000',
                'business_hours' => json_encode([
                    'Saturday - Thursday' => '8:00 AM - 10:00 PM',
                    'Friday' => '10:00 AM - 8:00 PM',
                ]),
                'social_links' => json_encode([
                    'facebook' => 'https://facebook.com/monark',
                    'linkedin' => 'https://linkedin.com/company/monark',
                    'instagram' => 'https://instagram.com/monark',
                ]),
                'map_embed' => null,
                'form_title' => 'Send a message',
                'form_subtitle' => 'Our support team will reply as soon as possible.',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('about')->updateOrInsert(
            ['title' => 'MONARK Smart Parking'],
            [
                'subtitle' => 'Premium parking and vehicle care platform for Bangladesh.',
                'mission' => 'Make urban parking predictable, fast, and transparent while connecting drivers with quality vehicle services.',
                'vision' => 'A connected mobility network where parking, checkout, wallet payments, and car care work together in one smooth flow.',
                'story' => 'MONARK started with a simple goal: reduce the stress around finding safe parking and maintaining vehicles in busy cities.',
                'values' => json_encode(['Reliability', 'Speed', 'Transparency', 'Service Quality', 'Customer Care']),
                'team' => json_encode([
                    ['name' => 'Moynul Islam Shimanto', 'position' => 'Founder', 'bio' => 'Product and operations lead.'],
                    ['name' => 'Nusrat Ahmed', 'position' => 'Customer Success', 'bio' => 'Keeps every booking flow clean and support-ready.'],
                ]),
                'stats' => json_encode([
                    'parking_locations' => self::PARKING_COUNT,
                    'service_centers' => self::SERVICE_CENTER_COUNT,
                    'demo_customers' => self::USER_COUNT,
                    'bookings_processed' => self::BOOKING_COUNT,
                ]),
                'image' => '/images/parking-hero.png',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );
    }

    private function seedPaymentMethods(Carbon $now): void
    {
        $methods = [
            ['bKash Merchant', 'mobile_banking', '01700000001'],
            ['Nagad Merchant', 'mobile_banking', '01800000002'],
            ['Rocket Merchant', 'mobile_banking', '01900000003'],
            ['Visa Card', 'card', null],
            ['Mastercard', 'card', null],
        ];

        foreach ($methods as [$name, $type, $account]) {
            DB::table('payment_methods')->updateOrInsert(
                ['name' => $name],
                [
                    'type' => $type,
                    'account_number' => $account,
                    'is_active' => true,
                    'credentials' => json_encode(['mode' => 'demo']),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }

    private function seedUsers(string $runKey, Carbon $now): array
    {
        $rows = [];
        $roles = array_merge(array_fill(0, self::USER_COUNT - 8, 'user'), array_fill(0, 8, 'manager'));

        foreach (range(1, self::USER_COUNT) as $index) {
            $createdAt = $this->randomPastDate($now, 420);
            $rows[] = [
                'name' => $this->personName($index),
                'email' => "demo.user.{$runKey}.{$index}@monark.test",
                'email_verified_at' => $index % 9 === 0 ? null : $createdAt,
                'password' => Hash::make('password'),
                'remember_token' => Str::random(10),
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
                'role' => $roles[$index - 1],
                'wallet_balance' => fake()->numberBetween(0, 42000),
                'is_blocked' => $index % 37 === 0,
            ];
        }

        DB::table('users')->insert($rows);

        return DB::table('users')
            ->where('email', 'like', "demo.user.{$runKey}.%@monark.test")
            ->pluck('id')
            ->all();
    }

    private function seedParkingsAndSlots(string $runKey, Carbon $now): array
    {
        $parkingRows = [];
        $areas = ['Dhanmondi', 'Gulshan', 'Banani', 'Uttara', 'Mirpur', 'Motijheel', 'Narayanganj', 'Bashundhara', 'Tejgaon', 'Wari'];
        $images = ['/images/parking-lot1.jpg', '/images/parking-lot2.jpg', '/images/parking-lot3.jpg', '/images/parking-hero.png'];

        foreach (range(1, self::PARKING_COUNT) as $index) {
            $totalSlots = fake()->numberBetween(18, 70);
            $area = $areas[($index - 1) % count($areas)];
            $createdAt = $this->randomPastDate($now, 360);

            $parkingRows[] = [
                'name' => "{$area} MONARK Parking {$runKey}-{$index}",
                'image' => $images[$index % count($images)],
                'description' => "Secure {$area} parking with camera monitoring, quick checkout, and trained attendants.",
                'total_slots' => $totalSlots,
                'available_slots' => 0,
                'price_per_hour' => fake()->numberBetween(40, 180),
                'distance' => fake()->randomFloat(1, 0.3, 9.8) . ' km',
                'latitude' => 23.6000000 + fake()->randomFloat(7, 0, 0.2500000),
                'longitude' => 90.3500000 + fake()->randomFloat(7, 0, 0.2500000),
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ];
        }

        DB::table('parkings')->insert($parkingRows);
        $parkingRecords = DB::table('parkings')
            ->where('name', 'like', "%{$runKey}-%")
            ->get(['id', 'total_slots'])
            ->values();

        $result = [];
        $slotRows = [];

        foreach ($parkingRecords as $parkingIndex => $parking) {
            foreach (range(1, (int) $parking->total_slots) as $slotIndex) {
                $slotRows[] = [
                    'parking_id' => $parking->id,
                    'slot_code' => 'P' . str_pad((string) ($parkingIndex + 1), 2, '0', STR_PAD_LEFT) . '-' . str_pad((string) $slotIndex, 3, '0', STR_PAD_LEFT),
                    'type' => $slotIndex % 5 === 0 ? 'Large' : 'Standard',
                    'available' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        foreach (array_chunk($slotRows, 800) as $chunk) {
            DB::table('slots')->insert($chunk);
        }

        foreach ($parkingRecords as $parking) {
            $slotIds = DB::table('slots')->where('parking_id', $parking->id)->pluck('id')->all();
            $result[] = ['id' => $parking->id, 'slot_ids' => $slotIds];
            DB::table('parkings')->where('id', $parking->id)->update(['available_slots' => count($slotIds)]);
        }

        return $result;
    }

    private function seedServiceCentersAndServices(string $runKey, Carbon $now): array
    {
        $centerRows = [];
        $areas = ['Chasara', 'Gulshan', 'Banani', 'Mirpur', 'Uttara', 'Dhanmondi', 'Badda', 'Mohakhali'];

        foreach (range(1, self::SERVICE_CENTER_COUNT) as $index) {
            $area = $areas[($index - 1) % count($areas)];
            $centerRows[] = [
                'name' => "{$area} MONARK Care {$runKey}-{$index}",
                'address' => "{$area}, Dhaka, Bangladesh",
                'phone' => '+88019' . fake()->numerify('########'),
                'email' => "care.{$runKey}.{$index}@monark.test",
                'latitude' => 23.6100000 + fake()->randomFloat(7, 0, 0.2400000),
                'longitude' => 90.3600000 + fake()->randomFloat(7, 0, 0.2400000),
                'opening_hours' => fake()->randomElement(['8:00 AM - 10:00 PM', '9:00 AM - 9:00 PM', '24 Hours']),
                'image' => '/images/parking-hero-2.jpg',
                'is_active' => $index % 11 !== 0,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('service_centers')->insert($centerRows);
        $centerIds = DB::table('service_centers')
            ->where('email', 'like', "care.{$runKey}.%@monark.test")
            ->pluck('id')
            ->all();

        $serviceNames = [
            'Premium Car Wash', 'Interior Deep Clean', 'Wax & Polish', 'Engine Bay Cleaning',
            'AC Service', 'Ceramic Coating', 'Tire Rotation', 'Full Detailing',
            'Paint Protection', 'Brake Inspection', 'Battery Check',
        ];

        $serviceRows = [];
        foreach (range(1, self::SERVICE_COUNT) as $index) {
            $name = $serviceNames[($index - 1) % count($serviceNames)];
            $serviceRows[] = [
                'service_center_id' => $centerIds[array_rand($centerIds)],
                'name' => "{$name} {$runKey}-{$index}",
                'type' => Str::slug($name),
                'description' => "Professional {$name} by MONARK trained specialists.",
                'image' => '/images/parking-hero-3.jpg',
                'price' => fake()->numberBetween(350, 4500),
                'duration' => fake()->randomElement(['30 min', '45 min', '1 hr', '1.5 hr', '2 hr', '3 hr']),
                'status' => $index % 14 === 0 ? 'inactive' : 'active',
                'is_active' => $index % 14 !== 0,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('services')->insert($serviceRows);

        return DB::table('services')
            ->where('name', 'like', "%{$runKey}-%")
            ->pluck('id')
            ->all();
    }

    private function seedBookings(array $users, array $parkings, string $runKey, Carbon $now): void
    {
        $rows = [];
        $occupiedSlotIds = [];
        $statuses = ['pending', 'confirmed', 'completed', 'cancelled', 'checkout_requested', 'checkout_paid', 'rejected'];

        foreach (range(1, self::BOOKING_COUNT) as $index) {
            $parking = $parkings[array_rand($parkings)];
            $slotId = $parking['slot_ids'][array_rand($parking['slot_ids'])];
            $hours = fake()->numberBetween(1, 8);
            $pricePerHour = (float) DB::table('parkings')->where('id', $parking['id'])->value('price_per_hour');
            $baseTotal = $hours * $pricePerHour;
            $status = $statuses[array_rand($statuses)];
            $createdAt = $this->randomPastDate($now, 240);
            $endTime = (clone $createdAt)->addHours($hours);
            $extraCharges = in_array($status, ['checkout_requested', 'checkout_paid', 'completed'], true) ? fake()->randomElement([0, 0, 50, 100, 150, 250]) : 0;
            $ticketGenerated = $status === 'completed' && $index % 3 !== 0;

            if (in_array($status, ['confirmed', 'checkout_requested', 'checkout_paid'], true)) {
                $occupiedSlotIds[$slotId] = true;
            }

            $rows[] = [
                'user_id' => $users[array_rand($users)],
                'parking_id' => $parking['id'],
                'slot_id' => $slotId,
                'hours' => $hours,
                'end_time' => $endTime,
                'total_price' => $baseTotal,
                'status' => $status,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
                'checkout_requested' => in_array($status, ['checkout_requested', 'checkout_paid'], true),
                'checkout_approved' => $status === 'completed',
                'actual_end_time' => in_array($status, ['completed', 'checkout_requested', 'checkout_paid'], true) ? (clone $endTime)->addMinutes(fake()->numberBetween(0, 120)) : null,
                'extra_charges' => $extraCharges,
                'grand_total' => $baseTotal + $extraCharges,
                'ticket_generated' => $ticketGenerated,
                'ticket_number' => $ticketGenerated ? 'TCK-' . $runKey . '-' . str_pad((string) $index, 6, '0', STR_PAD_LEFT) : null,
            ];
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('bookings')->insert($chunk);
        }

        if ($occupiedSlotIds) {
            DB::table('slots')->whereIn('id', array_keys($occupiedSlotIds))->update(['available' => false]);
        }

        foreach ($parkings as $parking) {
            $available = DB::table('slots')
                ->where('parking_id', $parking['id'])
                ->where('available', true)
                ->count();

            DB::table('parkings')->where('id', $parking['id'])->update(['available_slots' => $available]);
        }
    }

    private function seedServiceOrders(array $users, array $services, string $runKey, Carbon $now): void
    {
        $rows = [];
        $statuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

        foreach (range(1, self::SERVICE_ORDER_COUNT) as $index) {
            $status = $statuses[array_rand($statuses)];
            $createdAt = $this->randomPastDate($now, 210);
            $completed = $status === 'completed';

            $rows[] = [
                'user_id' => $users[array_rand($users)],
                'service_id' => $services[array_rand($services)],
                'booking_time' => (clone $createdAt)->addDays(fake()->numberBetween(0, 21))->setTime(fake()->numberBetween(8, 20), fake()->randomElement([0, 15, 30, 45])),
                'status' => $status,
                'notes' => fake()->randomElement([
                    'Customer requested morning slot.',
                    'Please call before arrival.',
                    'Vehicle needs extra interior attention.',
                    null,
                ]),
                'slip_number' => in_array($status, ['confirmed', 'in_progress', 'completed'], true) ? 'SLP-' . $runKey . '-' . str_pad((string) $index, 6, '0', STR_PAD_LEFT) : null,
                'invoice_number' => $completed ? 'INV-' . $runKey . '-' . str_pad((string) $index, 6, '0', STR_PAD_LEFT) : null,
                'invoice_generated_at' => $completed ? (clone $createdAt)->addDays(fake()->numberBetween(1, 5)) : null,
                'created_at' => $createdAt,
                'updated_at' => $completed ? (clone $createdAt)->addDays(fake()->numberBetween(1, 5)) : $createdAt,
            ];
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('service_orders')->insert($chunk);
        }
    }

    private function seedWalletTransactions(array $users, string $runKey, Carbon $now): void
    {
        $rows = [];
        $statuses = ['pending', 'verified', 'completed', 'failed'];
        $methods = ['bkash', 'nagad', 'card', 'wallet'];

        foreach (range(1, self::WALLET_TRANSACTION_COUNT) as $index) {
            $status = $statuses[array_rand($statuses)];
            $createdAt = $this->randomPastDate($now, 260);
            $verifiedAt = in_array($status, ['verified', 'completed', 'failed'], true) ? (clone $createdAt)->addMinutes(fake()->numberBetween(5, 90)) : null;
            $approvedAt = in_array($status, ['completed', 'failed'], true) ? (clone $createdAt)->addHours(fake()->numberBetween(1, 36)) : null;

            $rows[] = [
                'user_id' => $users[array_rand($users)],
                'type' => fake()->randomElement(['topup', 'payment', 'refund']),
                'amount' => fake()->numberBetween(200, 25000),
                'payment_method' => $methods[array_rand($methods)],
                'mobile_number' => '+8801' . fake()->numerify('#########'),
                'pin' => null,
                'generated_transaction_id' => 'GTX-' . $runKey . '-' . str_pad((string) $index, 6, '0', STR_PAD_LEFT),
                'verification_code' => fake()->numerify('######'),
                'verified_at' => $verifiedAt,
                'approved_by' => $approvedAt ? User::where('email', 'admin@gmail.com')->value('id') : null,
                'approved_at' => $approvedAt,
                'transaction_id' => 'TRX-' . $runKey . '-' . str_pad((string) $index, 6, '0', STR_PAD_LEFT),
                'status' => $status,
                'description' => fake()->randomElement([
                    'Wallet top-up request',
                    'Parking booking wallet payment',
                    'Service order payment',
                    'Refund adjustment',
                ]),
                'created_at' => $createdAt,
                'updated_at' => $approvedAt ?: ($verifiedAt ?: $createdAt),
            ];
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('wallet_transactions')->insert($chunk);
        }
    }

    private function seedMessages(string $runKey, Carbon $now): void
    {
        $rows = [];
        $subjects = [
            'Parking slot availability',
            'Wallet top-up help',
            'Service appointment query',
            'Checkout support needed',
            'Corporate parking package',
            'Invoice request',
        ];

        foreach (range(1, self::MESSAGE_COUNT) as $index) {
            $createdAt = $this->randomPastDate($now, 180);
            $rows[] = [
                'name' => $this->personName($index + 700),
                'email' => "message.{$runKey}.{$index}@monark.test",
                'subject' => $subjects[array_rand($subjects)],
                'message' => fake()->paragraph(fake()->numberBetween(2, 5)),
                'status' => fake()->randomElement(['unread', 'read', 'replied']),
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ];
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('messages')->insert($chunk);
        }
    }

    private function randomPastDate(Carbon $now, int $days): Carbon
    {
        return (clone $now)
            ->subDays(fake()->numberBetween(0, $days))
            ->setTime(fake()->numberBetween(7, 23), fake()->numberBetween(0, 59), fake()->numberBetween(0, 59));
    }

    private function personName(int $index): string
    {
        $firstNames = ['Moynul', 'Shimanto', 'Arafat', 'Nusrat', 'Tanvir', 'Farhana', 'Rahim', 'Karim', 'Sadia', 'Rafi', 'Nabila', 'Sakib'];
        $lastNames = ['Islam', 'Ahmed', 'Rahman', 'Hossain', 'Khan', 'Chowdhury', 'Hasan', 'Akter', 'Begum', 'Miah'];

        return $firstNames[$index % count($firstNames)] . ' ' . $lastNames[$index % count($lastNames)];
    }
}
