# Flutter Integration Guide

This guide explains how to integrate the Korapay checkout flow in your Flutter application.

## Prerequisites

Add these dependencies to your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^0.13.5
  webview_flutter: ^3.0.4
  url_launcher: ^6.1.7
```

## Integration Steps

### 1. Create a Payment Service

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class PaymentService {
  final String apiUrl;
  
  PaymentService({required this.apiUrl});
  
  Future<Map<String, dynamic>> initializeCheckout({
    required String amount,
    required String cryptoType,
    required String email,
    required String name,
    required String walletAddress,
  }) async {
    final response = await http.post(
      Uri.parse('$apiUrl/payment/checkout'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'naira_amount': amount,
        'crypto_type': cryptoType,
        'email': email,
        'name': name,
        'wallet_address': walletAddress,
      }),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to initialize checkout: ${response.body}');
    }
  }
  
  Future<Map<String, dynamic>> verifyPayment(String reference) async {
    final response = await http.get(
      Uri.parse('$apiUrl/payment/verify/$reference'),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to verify payment: ${response.body}');
    }
  }
}
```

### 2. Create a Checkout Page with WebView

```dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../services/payment_service.dart';

class CheckoutPage extends StatefulWidget {
  final String amount;
  final String cryptoType;
  final String email;
  final String name;
  final String walletAddress;
  
  const CheckoutPage({
    Key? key,
    required this.amount,
    required this.cryptoType,
    required this.email,
    required this.name,
    required this.walletAddress,
  }) : super(key: key);
  
  @override
  _CheckoutPageState createState() => _CheckoutPageState();
}

class _CheckoutPageState extends State<CheckoutPage> {
  final PaymentService _paymentService = PaymentService(
    apiUrl: 'https://your-api-url.com/api',
  );
  
  bool _isLoading = true;
  String? _checkoutUrl;
  String? _reference;
  String? _errorMessage;
  
  @override
  void initState() {
    super.initState();
    _initializeCheckout();
  }
  
  Future<void> _initializeCheckout() async {
    try {
      final result = await _paymentService.initializeCheckout(
        amount: widget.amount,
        cryptoType: widget.cryptoType,
        email: widget.email,
        name: widget.name,
        walletAddress: widget.walletAddress,
      );
      
      if (result['status'] == 'success') {
        setState(() {
          _checkoutUrl = result['data']['checkout_url'];
          _reference = result['data']['reference'];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = result['message'] ?? 'Failed to initialize checkout';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Complete Payment'),
      ),
      body: _buildBody(),
    );
  }
  
  Widget _buildBody() {
    if (_isLoading) {
      return Center(child: CircularProgressIndicator());
    }
    
    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Error',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 16),
              Text(_errorMessage!),
              SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                child: Text('Go Back'),
              ),
            ],
          ),
        ),
      );
    }
    
    return WebView(
      initialUrl: _checkoutUrl,
      javascriptMode: JavascriptMode.unrestricted,
      onPageStarted: (String url) {
        // Check if the URL is your success URL
        if (url.contains('/api/payment/success')) {
          // Extract reference from URL if needed
          // You can also just use the reference we already have
          _verifyPayment();
        }
      },
    );
  }
  
  Future<void> _verifyPayment() async {
    try {
      final result = await _paymentService.verifyPayment(_reference!);
      
      if (result['data']['status'] == 'success') {
        // Payment successful
        Navigator.of(context).pop(true);
      } else if (result['data']['status'] == 'pending') {
        // Payment still processing
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Payment is still processing')),
        );
      } else {
        // Payment failed
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Payment failed')),
        );
        Navigator.of(context).pop(false);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error verifying payment: $e')),
      );
    }
  }
}
```

### 3. Use the Checkout Page in Your App

```dart
import 'package:flutter/material.dart';
import 'checkout_page.dart';

class BuyCryptoPage extends StatefulWidget {
  @override
  _BuyCryptoPageState createState() => _BuyCryptoPageState();
}

class _BuyCryptoPageState extends State<BuyCryptoPage> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  String _selectedCrypto = 'ETH';
  final _emailController = TextEditingController();
  final _nameController = TextEditingController();
  final _walletController = TextEditingController();
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Buy Cryptocurrency'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              TextFormField(
                controller: _amountController,
                decoration: InputDecoration(
                  labelText: 'Amount (NGN)',
                  hintText: 'Enter amount in Naira',
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter an amount';
                  }
                  if (double.tryParse(value) == null) {
                    return 'Please enter a valid number';
                  }
                  if (double.parse(value) < 500) {
                    return 'Minimum amount is 500 NGN';
                  }
                  return null;
                },
              ),
              SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedCrypto,
                decoration: InputDecoration(
                  labelText: 'Cryptocurrency',
                ),
                items: [
                  DropdownMenuItem(value: 'ETH', child: Text('Ethereum (ETH)')),
                  DropdownMenuItem(value: 'BTC', child: Text('Bitcoin (BTC)')),
                ],
                onChanged: (value) {
                  setState(() {
                    _selectedCrypto = value!;
                  });
                },
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _emailController,
                decoration: InputDecoration(
                  labelText: 'Email',
                  hintText: 'Enter your email',
                ),
                keyboardType: TextInputType.emailAddress,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your email';
                  }
                  if (!value.contains('@')) {
                    return 'Please enter a valid email';
                  }
                  return null;
                },
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _nameController,
                decoration: InputDecoration(
                  labelText: 'Full Name',
                  hintText: 'Enter your full name',
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your name';
                  }
                  return null;
                },
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _walletController,
                decoration: InputDecoration(
                  labelText: 'Wallet Address',
                  hintText: 'Enter your wallet address',
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your wallet address';
                  }
                  return null;
                },
              ),
              SizedBox(height: 24),
              ElevatedButton(
                onPressed: _proceedToCheckout,
                child: Text('Proceed to Payment'),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  void _proceedToCheckout() async {
    if (_formKey.currentState!.validate()) {
      final result = await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => CheckoutPage(
            amount: _amountController.text,
            cryptoType: _selectedCrypto,
            email: _emailController.text,
            name: _nameController.text,
            walletAddress: _walletController.text,
          ),
        ),
      );
      
      if (result == true) {
        // Payment was successful
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Payment successful! Your crypto is on the way.')),
        );
      }
    }
  }
}
```

## Testing the Integration

1. Run your backend server with the Korapay integration
2. Update the API URL in the `PaymentService` class to point to your server
3. Run the Flutter app and test the payment flow

## Troubleshooting

- If the WebView doesn't load, check if your device has internet access
- If the payment fails, verify your Korapay credentials in the backend
- If the success page doesn't redirect properly, check the redirect URL configuration 