import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryTitle: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    categoryTitle,
  }: Request): Promise<Transaction> {
    const categoriesRepository = getRepository(Category);

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const categoryTitleArray = categoryTitle.split(' ');

    const formattedCategoryTitleArray = categoryTitleArray.map(
      t => t[0].toUpperCase() + t.substr(1).toLowerCase(),
    );

    const formattedCategoryTitle = formattedCategoryTitleArray.join(' ');

    const category = await categoriesRepository.findOne({
      where: { title: formattedCategoryTitle },
    });

    let categoryId = '';

    if (!category) {
      const { identifiers } = await categoriesRepository.insert({
        title: formattedCategoryTitle,
      });

      categoryId = identifiers[0].id;
    } else {
      categoryId = category.id;
    }

    const formattedType = type.toLowerCase();

    if (formattedType !== 'income' && formattedType !== 'outcome') {
      throw new AppError(
        'Invalid transaction type! Transactions can only have "income" or "outcome" types.',
      );
    }

    const { total } = await transactionsRepository.getBalance();

    if (formattedType === 'outcome' && value > total) {
      throw new AppError('Insufficient funds to complete this transaction!');
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type: formattedType,
      category_id: categoryId,
      category: formattedCategoryTitle,
    });

    await transactionsRepository.save(transaction);

    delete transaction.category_id;

    return transaction;
  }
}

export default CreateTransactionService;
