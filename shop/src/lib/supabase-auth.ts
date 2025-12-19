import { createClient } from '@supabase/supabase-js';
import { User } from '@/models/User';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Main client for auth operations (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for admin operations (uses service key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export class AuthService {
  // Sync user from Supabase to MongoDB
  static async syncUserFromSupabase(supabaseUserId: string) {
    try {
      console.log('🔄 Syncing user from Supabase:', supabaseUserId);

      // Get user from Supabase
      const { data: supabaseUser, error } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId);

      if (error || !supabaseUser.user) {
        console.error('❌ Supabase user not found:', error);
        throw new Error('User not found in Supabase');
      }

      console.log('✅ Found Supabase user:', supabaseUser.user.email);

      // Check if user exists in MongoDB
      let mongoUser = await User.findOne({ supabaseId: supabaseUserId });

      if (!mongoUser) {
        console.log('📝 Creating new user in MongoDB...');

        // Create new user in MongoDB
        mongoUser = new User({
          supabaseId: supabaseUserId,
          email: supabaseUser.user.email,
          fullName: supabaseUser.user.user_metadata?.full_name || supabaseUser.user.email,
          emailVerified: supabaseUser.user.email_confirmed_at ? true : false,
          role: 'customer',
          preferences: {
            language: 'ar',
            currency: 'SAR',
            notifications: {
              email: true,
              sms: false,
              push: true
            }
          },
          isActive: true,
        });

        await mongoUser.save();
        console.log('✅ User created in MongoDB:', mongoUser._id);
      } else {
        console.log('✅ User already exists in MongoDB:', mongoUser._id);
      }

      return mongoUser;
    } catch (error) {
      console.error('❌ Error syncing user from Supabase:', error);
      throw error;
    }
  }

  // Create user in Supabase and sync to MongoDB
  static async createUserWithSupabase(email: string, password: string, fullName: string) {
    try {
      // Create user in Supabase
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        }
      });

      if (error) {
        throw error;
      }

      // Sync to MongoDB
      const mongoUser = await this.syncUserFromSupabase(data.user.id);

      return {
        supabaseUser: data.user,
        mongoUser,
      };
    } catch (error) {
      console.error('Error creating user with Supabase:', error);
      throw error;
    }
  }

  // Sign in with Supabase
  static async signInWithSupabase(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Sync user data to MongoDB if needed
      await this.syncUserFromSupabase(data.user.id);

      return data;
    } catch (error) {
      console.error('Error signing in with Supabase:', error);
      throw error;
    }
  }

  // Update user profile in both systems
  static async updateUserProfile(supabaseUserId: string, updates: any) {
    try {
      // Update in Supabase
      const { error: supabaseError } = await supabaseAdmin.auth.admin.updateUserById(
        supabaseUserId,
        {
          user_metadata: updates,
        }
      );

      if (supabaseError) {
        throw supabaseError;
      }

      // Update in MongoDB
      const mongoUser = await User.findOneAndUpdate(
        { supabaseId: supabaseUserId },
        {
          ...updates,
          updatedAt: new Date(),
        },
        { new: true }
      );

      return mongoUser;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
}
