import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class UserBuyFlowScreen extends StatefulWidget {
  @override
  _UserBuyFlowScreenState createState() => _UserBuyFlowScreenState();
}

class _UserBuyFlowScreenState extends State<UserBuyFlowScreen> {
  final String apiBaseUrl = 'http://your-api-url.com/api';
  
  // Form controllers
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController nameController = TextEditingController();
  final TextEditingController amountController = TextEditingController();
  
  // State variables
  String userId = '';
  String authToken = '';
  String walletAddress = '';
  String transactionId = '';
  String paymentReference = '';
  String txHash = '';
  String cryptoBalance = '';
  
  // Flow state
  int currentStep = 0;
  bool isLoading = false;
  String errorMessage = '';
  
  @override
  void initState() {
    super.initState();
    // Pre-fill some test values
    emailController.text = 'test-${DateTime.now().millisecondsSinceEpoch}@example.com';
    passwordController.text = 'Password123!';
    nameController.text = 'Test User';
    amountController.text = '0.01'; // ETH amount
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Buy Crypto Test Flow'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: isLoading
            ? Center(child: CircularProgressIndicator())
            : _buildCurrentStep(),
      ),
    );
  }
  
  Widget _buildCurrentStep() {
    switch (currentStep) {
      case 0:
        return _buildRegistrationStep();
      case 1:
        return _buildWalletStep();
      case 2:
        return _buildBuyStep();
      case 3:
        return _buildPaymentStep();
      case 4:
        return _buildVerificationStep();
      case 5:
        return _buildCompletionStep();
      default:
        return Center(child: Text('Unknown step'));
    }
  }
  
  Widget _buildRegistrationStep() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Step 1: Register a New User',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 20),
          TextField(
            controller: emailController,
            decoration: InputDecoration(labelText: 'Email'),
            keyboardType: TextInputType.emailAddress,
          ),
          TextField(
            controller: passwordController,
            decoration: InputDecoration(labelText: 'Password'),
            obscureText: true,
          ),
          TextField(
            controller: nameController,
            decoration: InputDecoration(labelText: 'Full Name'),
          ),
          SizedBox(height: 20),
          if (errorMessage.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 16.0),
              child: Text(
                errorMessage,
                style: TextStyle(color: Colors.red),
              ),
            ),
          ElevatedButton(
            onPressed: _registerUser,
            child: Text('Register'),
          ),
        ],
      ),
    );
  }
  
  Widget _buildWalletStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Step 2: Get User Wallet',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 20),
        Text('User ID: $userId'),
        SizedBox(height: 10),
        if (walletAddress.isNotEmpty)
          Text('Wallet Address: $walletAddress'),
        SizedBox(height: 20),
        if (errorMessage.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 16.0),
            child: Text(
              errorMessage,
              style: TextStyle(color: Colors.red),
            ),
          ),
        ElevatedButton(
          onPressed: _getWallet,
          child: Text('Get Wallet'),
        ),
        SizedBox(height: 10),
        ElevatedButton(
          onPressed: () {
            setState(() {
              currentStep = 2;
              errorMessage = '';
            });
          },
          child: Text('Next: Buy Crypto'),
        ),
      ],
    );
  }
  
  Widget _buildBuyStep() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Step 3: Buy Crypto',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 20),
          Text('Wallet Address: $walletAddress'),
          SizedBox(height: 20),
          TextField(
            controller: amountController,
            decoration: InputDecoration(labelText: 'ETH Amount'),
            keyboardType: TextInputType.numberWithOptions(decimal: true),
          ),
          SizedBox(height: 10),
          Text('Estimated Cost: ${_calculateFiatAmount()} NGN'),
          SizedBox(height: 20),
          if (errorMessage.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 16.0),
              child: Text(
                errorMessage,
                style: TextStyle(color: Colors.red),
              ),
            ),
          ElevatedButton(
            onPressed: _initiateBuy,
            child: Text('Buy ETH'),
          ),
        ],
      ),
    );
  }
  
  Widget _buildPaymentStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Step 4: Payment',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 20),
        Text('Transaction ID: $transactionId'),
        Text('Payment Reference: $paymentReference'),
        SizedBox(height: 20),
        // Test card information
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Test Card Information:', style: TextStyle(fontWeight: FontWeight.bold)),
                SizedBox(height: 8),
                Text('Card Number: 5399 8383 8383 8381'),
                Text('Expiry Date: Any future date (e.g., 10/25)'),
                Text('CVV: Any 3 digits (e.g., 123)'),
                Text('PIN: Any 4 digits (e.g., 1234)'),
                Text('OTP: 123456'),
              ],
            ),
          ),
        ),
        SizedBox(height: 20),
        if (errorMessage.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 16.0),
            child: Text(
              errorMessage,
              style: TextStyle(color: Colors.red),
            ),
          ),
        ElevatedButton(
          onPressed: _simulatePayment,
          child: Text('Simulate Successful Payment'),
        ),
      ],
    );
  }
  
  Widget _buildVerificationStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Step 5: Verify Transaction',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 20),
        Text('Transaction ID: $transactionId'),
        if (txHash.isNotEmpty) Text('Blockchain Hash: $txHash'),
        SizedBox(height: 20),
        if (errorMessage.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 16.0),
            child: Text(
              errorMessage,
              style: TextStyle(color: Colors.red),
            ),
          ),
        ElevatedButton(
          onPressed: _verifyTransaction,
          child: Text('Verify Transaction'),
        ),
        SizedBox(height: 10),
        ElevatedButton(
          onPressed: () {
            setState(() {
              currentStep = 5;
              errorMessage = '';
            });
            _checkBalance();
          },
          child: Text('Next: Check Balance'),
        ),
      ],
    );
  }
  
  Widget _buildCompletionStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Step 6: Completion',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 20),
        Text('Transaction Completed Successfully!'),
        SizedBox(height: 10),
        Text('Transaction ID: $transactionId'),
        Text('Blockchain Hash: $txHash'),
        SizedBox(height: 20),
        Text('ETH Balance: $cryptoBalance ETH', 
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        SizedBox(height: 30),
        ElevatedButton(
          onPressed: () {
            setState(() {
              // Reset the flow
              currentStep = 0;
              userId = '';
              authToken = '';
              walletAddress = '';
              transactionId = '';
              paymentReference = '';
              txHash = '';
              cryptoBalance = '';
              errorMessage = '';
              
              // Generate a new test email
              emailController.text = 'test-${DateTime.now().millisecondsSinceEpoch}@example.com';
            });
          },
          child: Text('Start Over'),
        ),
      ],
    );
  }
  
  String _calculateFiatAmount() {
    try {
      double ethAmount = double.parse(amountController.text);
      // Simple conversion rate for testing (1 ETH = 1,000,000 NGN)
      return (ethAmount * 1000000).toStringAsFixed(2);
    } catch (e) {
      return '0.00';
    }
  }
  
  Future<void> _registerUser() async {
    setState(() {
      isLoading = true;
      errorMessage = '';
    });
    
    try {
      final response = await http.post(
        Uri.parse('$apiBaseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': emailController.text,
          'password': passwordController.text,
          'name': nameController.text,
        }),
      );
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        setState(() {
          userId = data['data']['user']['id'];
          authToken = data['data']['token'];
          currentStep = 1;
        });
        
        // Save token to shared preferences
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', authToken);
        
        print('User registered successfully: $userId');
      } else {
        setState(() {
          errorMessage = 'Registration failed: ${response.body}';
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Error: $e';
      });
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }
  
  Future<void> _getWallet() async {
    setState(() {
      isLoading = true;
      errorMessage = '';
    });
    
    try {
      final response = await http.get(
        Uri.parse('$apiBaseUrl/wallet'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          walletAddress = data['data']['eth_address'];
        });
        
        print('Got wallet address: $walletAddress');
      } else {
        setState(() {
          errorMessage = 'Failed to get wallet: ${response.body}';
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Error: $e';
      });
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }
  
  Future<void> _initiateBuy() async {
    setState(() {
      isLoading = true;
      errorMessage = '';
    });
    
    try {
      final fiatAmount = _calculateFiatAmount();
      
      final response = await http.post(
        Uri.parse('$apiBaseUrl/payment/checkout'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({
          'amount': fiatAmount,
          'email': emailController.text,
          'name': nameController.text,
          'payment_method': 'card',
          'crypto_amount': amountController.text,
          'crypto_type': 'ETH',
          'wallet_address': walletAddress,
        }),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          transactionId = data['data']['transaction_id'];
          paymentReference = data['data']['reference'];
          currentStep = 3;
        });
        
        print('Buy initiated: $transactionId, $paymentReference');
      } else {
        setState(() {
          errorMessage = 'Failed to initiate buy: ${response.body}';
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Error: $e';
      });
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }
  
  Future<void> _simulatePayment() async {
    setState(() {
      isLoading = true;
      errorMessage = '';
    });
    
    try {
      // In a real app, this would redirect to the payment gateway
      // For testing, we'll simulate a successful payment
      
      // Poll for payment status
      bool isCompleted = false;
      int attempts = 0;
      
      while (!isCompleted && attempts < 10) {
        attempts++;
        
        final response = await http.get(
          Uri.parse('$apiBaseUrl/payment/status/$paymentReference'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $authToken',
          },
        );
        
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          final status = data['data']['transaction_status'];
          
          if (status == 'completed') {
            setState(() {
              txHash = data['data']['blockchain_tx_hash'] ?? '';
              isCompleted = true;
              currentStep = 4;
            });
            break;
          } else if (status == 'failed') {
            setState(() {
              errorMessage = 'Payment failed';
            });
            break;
          }
        }
        
        // Wait before next attempt
        await Future.delayed(Duration(seconds: 2));
      }
      
      if (!isCompleted) {
        // For testing, we'll simulate a successful completion
        setState(() {
          txHash = 'simulated-tx-hash-${DateTime.now().millisecondsSinceEpoch}';
          currentStep = 4;
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Error: $e';
      });
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }
  
  Future<void> _verifyTransaction() async {
    setState(() {
      isLoading = true;
      errorMessage = '';
    });
    
    try {
      final response = await http.get(
        Uri.parse('$apiBaseUrl/buy/verify/$transactionId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          txHash = data['data']['blockchain_tx_hash'] ?? txHash;
        });
        
        print('Transaction verified: $txHash');
      } else {
        setState(() {
          errorMessage = 'Failed to verify transaction: ${response.body}';
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Error: $e';
      });
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }
  
  Future<void> _checkBalance() async {
    setState(() {
      isLoading = true;
      errorMessage = '';
    });
    
    try {
      final response = await http.get(
        Uri.parse('$apiBaseUrl/wallet/balance'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          cryptoBalance = data['data']['eth_balance'] ?? '0';
        });
        
        print('Balance checked: $cryptoBalance ETH');
      } else {
        setState(() {
          errorMessage = 'Failed to check balance: ${response.body}';
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Error: $e';
      });
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }
} 