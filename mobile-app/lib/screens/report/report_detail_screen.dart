import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../services/api_service.dart';
import '../../widgets/glass_card.dart';

class ReportDetailScreen extends StatefulWidget {
  final String reportId;
  const ReportDetailScreen({Key? key, required this.reportId}) : super(key: key);

  @override
  _ReportDetailScreenState createState() => _ReportDetailScreenState();
}

class _ReportDetailScreenState extends State<ReportDetailScreen> {
  Map<String, dynamic>? _report;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchReportDetails();
  }

  Future<void> _fetchReportDetails() async {
    try {
      final data = await ApiService.fetchReportById(widget.reportId);
      setState(() {
        _report = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = "Could not load report details. $e";
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null || _report == null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(child: Text(_error ?? 'Not found')),
      );
    }

    final score = (_report!['avgConfidenceScore'] ?? 0).toDouble();
    final grade = score >= 80 ? "A" : score >= 70 ? "B" : "C";

    return Scaffold(
      appBar: AppBar(
        title: const Text("Interview Feedback"),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_report!['domain'] ?? 'General', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                    if (_report!['subtopic'] != null)
                      Text(_report!['subtopic'], style: const TextStyle(color: Colors.grey, fontSize: 16)),
                  ],
                ),
                CircleAvatar(
                  radius: 28,
                  backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
                  child: Text(grade, style: TextStyle(fontSize: 24, color: Theme.of(context).primaryColor, fontWeight: FontWeight.bold)),
                )
              ],
            ),
            const SizedBox(height: 32),

            GlassCard(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Metric Breakdown", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 16),
                  _buildMetricRow("Confidence Score", "${score.toStringAsFixed(1)} / 100", LucideIcons.trendingUp, Colors.green),
                  const Divider(height: 32),
                  _buildMetricRow("Anxiety Frequency", "${(_report!['anxietyScore'] ?? 0).toStringAsFixed(1)}%", LucideIcons.activity, Colors.redAccent),
                  const Divider(height: 32),
                  _buildMetricRow("Eye Contact Ratio", "${((_report!['eyeContactRatio'] ?? 0) * 100).toStringAsFixed(0)}%", LucideIcons.eye, Colors.blue),
                ],
              ),
            ),
            const SizedBox(height: 24),

            const Text("AI Feedback", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            GlassCard(
              padding: const EdgeInsets.all(20),
              child: const Text(
                "You maintained good structure using the STAR method. However, reducing filler words and maintaining longer eye contact will improve your perceived confidence.",
                style: TextStyle(height: 1.6),
              ),
            ),
          ],
        ),
      )
    );
  }

  Widget _buildMetricRow(String label, String value, IconData icon, Color iconColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(icon, color: iconColor, size: 20),
            const SizedBox(width: 12),
            Text(label, style: const TextStyle(fontSize: 16)),
          ],
        ),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
      ],
    );
  }
}
