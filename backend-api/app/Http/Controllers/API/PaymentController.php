<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\WalletTransaction;
use App\Models\User;
use App\Models\PaymentMethod;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function getPaymentMethods()
    {
        try {
            $methods = PaymentMethod::query()
                ->where('is_active', true)
                ->where('type', 'mobile_banking')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $methods
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Initiate topup transaction - SIMPLE VERSION
    public function initiateTopup(Request $request)
    {
        try {
            Log::info('Initiate topup called', $request->all());
            
            $request->validate([
                'amount' => 'required|numeric|min:10|max:10000',
                'payment_method' => 'required|string',
                'mobile_number' => 'required|string|size:11',
                'pin' => 'required|string|min:4|max:6'
            ]);

            $user = auth()->user();
            
            if (!$user) {
                Log::warning('User not authenticated');
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $paymentMethod = PaymentMethod::query()
                ->where('name', $request->payment_method)
                ->where('is_active', true)
                ->where('type', 'mobile_banking')
                ->first();

            if (!$paymentMethod) {
                return response()->json([
                    'success' => false,
                    'message' => 'Selected payment method is not available.'
                ], 422);
            }

            DB::beginTransaction();
            
            Log::info('User authenticated', ['user_id' => $user->id, 'email' => $user->email]);
            
            // Generate unique transaction ID
            $generatedTransactionId = 'TXN' . date('YmdHis') . Str::random(6);
            
            // Check if wallet_transactions has the new columns
            $hasNewColumns = \Schema::hasColumn('wallet_transactions', 'mobile_number');
            
            $transactionData = [
                'user_id' => $user->id,
                'type' => 'topup',
                'amount' => $request->amount,
                'payment_method' => $paymentMethod->name,
                'status' => 'pending',
                'description' => 'Wallet topup via ' . $paymentMethod->name,
                'generated_transaction_id' => $generatedTransactionId
            ];
            
            // Add new columns if they exist
            if ($hasNewColumns) {
                $transactionData['mobile_number'] = $request->mobile_number;
                $transactionData['pin'] = $request->pin;
            }
            
            // Create pending transaction
            $transaction = WalletTransaction::create($transactionData);

            DB::commit();

            Log::info('Transaction created successfully', ['transaction_id' => $generatedTransactionId]);

            return response()->json([
                'success' => true,
                'message' => 'Transaction initiated successfully',
                'data' => [
                    'transaction_id' => $generatedTransactionId,
                    'amount' => $request->amount,
                    'payment_method' => $paymentMethod->name,
                    'status' => 'pending'
                ]
            ]);

        } catch (\Exception $e) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }
            Log::error('Topup initiation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Transaction initiation failed: ' . $e->getMessage()
            ], 500);
        }
    }

    // Verify transaction
    public function verifyTransaction(Request $request)
    {
        try {
            $request->validate([
                'transaction_id' => 'required|string'
            ]);

            Log::info('Verify transaction called', ['transaction_id' => $request->transaction_id]);

            $transaction = WalletTransaction::where('generated_transaction_id', $request->transaction_id)
                ->where('user_id', auth()->id())
                ->first();

            if (!$transaction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $transaction
            ]);

        } catch (\Exception $e) {
            Log::error('Transaction verification error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Verification failed'
            ], 500);
        }
    }
}
